const crypto = require("crypto");
const repo = require("../repository/subscription.repository");
const paymentVerifier = require("../utils/paymentVerifier");
const mailer = require("../utils/subscriptionMailer");

const CHECKOUT_TTL_MS = 15 * 60 * 1000;

class ServiceError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.statusCode = status;
    this.code = code;
  }
}

// ---------- helpers ----------

const generateTxnId = () =>
  `AXS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

const buildUpiString = (vpa, merchant, amount, note, txnId) =>
  `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchant)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}&tr=${txnId}`;

const addCycle = (date, cycle) => {
  const d = new Date(date);
  if (cycle === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
};

const userName = (u) =>
  u.name || u.fullName || [u.firstName, u.lastName].filter(Boolean).join(" ") || undefined;

const toPlanDTO = (p) => ({
  id: p.planId,
  name: p.name,
  description: p.description,
  price: p.price,
  currencySymbol: p.currencySymbol,
  billingCycle: p.billingCycle,
  features: p.features,
  highlighted: p.highlighted,
  status: p.recommended ? "recommended" : undefined,
});

const toReceipt = (payment, user) => {
  const s = payment.planSnapshot || {};
  return {
    transactionId: payment.txnId,
    invoiceNo: payment.invoiceNo,
    plan: {
      id: payment.planId,
      name: s.name,
      description: s.description,
      price: s.price,
      currencySymbol: s.currencySymbol,
      billingCycle: s.billingCycle,
      features: s.features || [],
      highlighted: !!s.highlighted,
    },
    amount: payment.amount,
    currencySymbol: payment.currencySymbol,
    paidAt: payment.paidAt.toISOString(),
    userName: userName(user),
    userEmail: user.email,
  };
};

const toSubscriptionDTO = (s) =>
  s && {
    planId: s.planId,
    status: s.status,
    autoRenewal: s.autoRenewal,
    cycleStart: s.cycleStart.toISOString(),
    cycleEnd: s.cycleEnd.toISOString(),
    cancelledAt: s.cancelledAt ? s.cancelledAt.toISOString() : null,
    lastTxnId: s.lastTxnId,
  };

// Lazy expiry: no cron needed, state is corrected whenever it is read.
// NOTE: true auto-renewal needs a gateway mandate (UPI AutoPay / Razorpay
// subscriptions); until then an ended cycle simply expires.
const refreshStatus = async (sub) => {
  if (sub && sub.status !== "expired" && sub.cycleEnd.getTime() < Date.now()) {
    sub.status = "expired";
    sub.autoRenewal = false;
    await sub.save();
  }
  return sub;
};

const sendReceipt = async (payment, user, cycleEnd) => {
  if (!user.email) {
    await repo.setReceiptEmail(payment.txnId, { status: "skipped", sentAt: null, error: "No email on account" });
    return "skipped";
  }
  try {
    await mailer.sendReceiptEmail({ to: user.email, receipt: toReceipt(payment, user), cycleEnd });
    await repo.setReceiptEmail(payment.txnId, { status: "sent", sentAt: new Date(), error: null });
    return "sent";
  } catch (err) {
    console.error("[subscription] receipt email failed:", err.message);
    await repo.setReceiptEmail(payment.txnId, { status: "error", sentAt: null, error: err.message });
    return "error";
  }
};

// ---------- use cases ----------

async function listPlans() {
  const plans = await repo.findActivePlans();
  return plans.map(toPlanDTO);
}

async function getMySubscription(user) {
  const sub = await refreshStatus(await repo.findSubscriptionByUser(user._id));
  const paid = await repo.listPaidPayments(user._id);
  const history = paid.map((p) => toReceipt(p, user));
  const latest = sub ? history.find((r) => r.transactionId === sub.lastTxnId) || history[0] || null : null;
  return { subscription: toSubscriptionDTO(sub), receipt: latest, history };
}

async function createCheckout(user, planId) {
  const plan = await repo.findPlanById(planId);
  if (!plan || !plan.active) throw new ServiceError(404, "Plan not found", "PLAN_NOT_FOUND");

  const sub = await refreshStatus(await repo.findSubscriptionByUser(user._id));
  if (sub && sub.status === "active" && sub.planId === plan.planId) {
    throw new ServiceError(409, "You are already subscribed to this plan", "ALREADY_SUBSCRIBED");
  }

  await repo.expirePendingForUser(user._id);

  const vpa = process.env.UPI_VPA || "axsstudio@okhdfcbank";
  const merchant = process.env.UPI_MERCHANT_NAME || "AXS Studio";
  const txnId = generateTxnId();
  const upiString = buildUpiString(vpa, merchant, plan.price, `${plan.name} Subscription`, txnId);
  const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MS);

  await repo.createPayment({
    txnId,
    user: user._id,
    planId: plan.planId,
    planSnapshot: {
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currencySymbol: plan.currencySymbol,
      billingCycle: plan.billingCycle,
      features: plan.features,
      highlighted: plan.highlighted,
    },
    amount: plan.price, // always server-side price, never the client's
    currency: plan.currency,
    currencySymbol: plan.currencySymbol,
    upiString,
    expiresAt,
  });

  return {
    txnId,
    amount: plan.price,
    currencySymbol: plan.currencySymbol,
    upiString,
    expiresAt: expiresAt.toISOString(),
    merchant: { vpa, name: merchant },
    plan: toPlanDTO(plan),
  };
}

async function confirmPayment(user, txnId, proof) {
  const payment = await repo.findPaymentByTxn(txnId);
  if (!payment || String(payment.user) !== String(user._id)) {
    throw new ServiceError(404, "Payment not found", "PAYMENT_NOT_FOUND");
  }

  const finish = async (p) => {
    const sub = await repo.findSubscriptionByUser(user._id);
    return {
      receipt: toReceipt(p, user),
      subscription: toSubscriptionDTO(sub),
      emailStatus: p.receiptEmail ? p.receiptEmail.status : "idle",
    };
  };

  if (payment.status === "paid") return finish(payment); // idempotent
  if (payment.status !== "pending") {
    throw new ServiceError(409, "This payment is no longer pending", "PAYMENT_NOT_PENDING");
  }
  if (payment.expiresAt.getTime() < Date.now()) {
    await repo.markPaymentExpired(txnId);
    throw new ServiceError(410, "Checkout expired, please start again", "CHECKOUT_EXPIRED");
  }

  const verdict = await paymentVerifier.verify(payment, proof || {});
  if (!verdict.ok) {
    throw new ServiceError(402, verdict.reason || "Payment could not be verified", "PAYMENT_NOT_VERIFIED");
  }

  const paidAt = new Date();
  const claimed = await repo.markPaymentPaid(txnId, {
    paidAt,
    gatewayRef: verdict.gatewayRef || null,
    invoiceNo: `INV-${txnId.slice(-8)}`,
  });
  if (!claimed) return finish(await repo.findPaymentByTxn(txnId)); // lost a race, already paid

  const cycleEnd = addCycle(paidAt, claimed.planSnapshot.billingCycle);
  await repo.upsertSubscription(user._id, {
    planId: claimed.planId,
    status: "active",
    autoRenewal: true,
    cycleStart: paidAt,
    cycleEnd,
    cancelledAt: null,
    lastTxnId: txnId,
  });

  const emailStatus = await sendReceipt(claimed, user, cycleEnd);
  const result = await finish(await repo.findPaymentByTxn(txnId));
  return { ...result, emailStatus };
}

async function cancelSubscription(user) {
  const sub = await refreshStatus(await repo.findSubscriptionByUser(user._id));
  if (!sub || sub.status !== "active") {
    throw new ServiceError(409, "No active subscription to cancel", "NOT_ACTIVE");
  }
  sub.status = "cancelled";
  sub.autoRenewal = false;
  sub.cancelledAt = new Date();
  await sub.save();
  return { subscription: toSubscriptionDTO(sub) };
}

async function reactivateSubscription(user) {
  const sub = await refreshStatus(await repo.findSubscriptionByUser(user._id));
  if (!sub) throw new ServiceError(404, "No subscription found", "NO_SUBSCRIPTION");
  if (sub.status === "expired") {
    throw new ServiceError(402, "Your subscription has ended, please subscribe again", "PAYMENT_REQUIRED");
  }
  if (sub.status !== "cancelled") {
    throw new ServiceError(409, "Subscription is already active", "ALREADY_ACTIVE");
  }
  sub.status = "active";
  sub.autoRenewal = true;
  sub.cancelledAt = null;
  await sub.save();
  return { subscription: toSubscriptionDTO(sub) };
}

async function setAutoRenewal(user, autoRenewal) {
  if (typeof autoRenewal !== "boolean") {
    throw new ServiceError(400, "autoRenewal must be true or false", "BAD_REQUEST");
  }
  const sub = await refreshStatus(await repo.findSubscriptionByUser(user._id));
  if (!sub || sub.status !== "active") {
    throw new ServiceError(409, "Auto-renewal can only be changed on an active subscription", "NOT_ACTIVE");
  }
  sub.autoRenewal = autoRenewal;
  await sub.save();
  return { subscription: toSubscriptionDTO(sub) };
}

async function resendReceipt(user, txnId) {
  const payment = await repo.findPaymentByTxn(txnId);
  if (!payment || String(payment.user) !== String(user._id) || payment.status !== "paid") {
    throw new ServiceError(404, "Receipt not found", "PAYMENT_NOT_FOUND");
  }
  const sub = await repo.findSubscriptionByUser(user._id);
  const emailStatus = await sendReceipt(payment, user, sub ? sub.cycleEnd : undefined);
  return { emailStatus };
}

async function contactSales(payload, user) {
  const name = String((payload && payload.name) || "").trim();
  const email = String((payload && payload.email) || "").trim();
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new ServiceError(400, "Name and a valid email are required", "BAD_REQUEST");
  }
  const lead = await repo.createContactRequest({
    user: user ? user._id : null,
    name,
    email,
    phone: String(payload.phone || "").trim(),
    message: String(payload.message || "").trim().slice(0, 2000),
  });
  if (process.env.SALES_EMAIL) {
    mailer.sendSalesLeadEmail({ to: process.env.SALES_EMAIL, lead }).catch((e) =>
      console.error("[subscription] sales email failed:", e.message)
    );
  }
  return { id: lead._id };
}

module.exports = {
  ServiceError,
  listPlans,
  getMySubscription,
  createCheckout,
  confirmPayment,
  cancelSubscription,
  reactivateSubscription,
  setAutoRenewal,
  resendReceipt,
  contactSales,
};