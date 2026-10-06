const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const ContactRequest = require("../models/ContactRequest");

// ---- Plans ----
const findActivePlans = () => Plan.find({ active: true }).sort({ sortOrder: 1, price: 1 }).lean();
const findPlanById = (planId) => Plan.findOne({ planId }).lean();

// ---- Subscription ----
const findSubscriptionByUser = (userId) => Subscription.findOne({ user: userId });
const upsertSubscription = (userId, fields) =>
  Subscription.findOneAndUpdate(
    { user: userId },
    { $set: fields },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

// ---- Payments ----
const createPayment = (data) => Payment.create(data);
const findPaymentByTxn = (txnId) => Payment.findOne({ txnId });
const listPaidPayments = (userId) =>
  Payment.find({ user: userId, status: "paid" }).sort({ paidAt: -1 });
const expirePendingForUser = (userId) =>
  Payment.updateMany({ user: userId, status: "pending" }, { $set: { status: "expired" } });
const markPaymentExpired = (txnId) =>
  Payment.updateOne({ txnId, status: "pending" }, { $set: { status: "expired" } });
// Atomic claim: only one caller can flip pending -> paid (double-submit safe).
const markPaymentPaid = (txnId, fields) =>
  Payment.findOneAndUpdate(
    { txnId, status: "pending" },
    { $set: { ...fields, status: "paid" } },
    { new: true }
  );
const setReceiptEmail = (txnId, receiptEmail) =>
  Payment.updateOne({ txnId }, { $set: { receiptEmail } });

// ---- Contact sales ----
const createContactRequest = (data) => ContactRequest.create(data);

module.exports = {
  findActivePlans,
  findPlanById,
  findSubscriptionByUser,
  upsertSubscription,
  createPayment,
  findPaymentByTxn,
  listPaidPayments,
  expirePendingForUser,
  markPaymentExpired,
  markPaymentPaid,
  setReceiptEmail,
  createContactRequest,
};