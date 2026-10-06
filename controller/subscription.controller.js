const service = require("../service/subscription.service");

// Wraps a use case: success -> { success, data }, failure -> { success:false, message, code }
const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json({ success: true, data });
  } catch (err) {
    let status = err.status || (err.name === "ValidationError" ? 400 : 500);
    if (status >= 500) console.error("[subscription]", err);
    res.status(status).json({
      success: false,
      message: status >= 500 ? "Something went wrong" : err.message,
      code: err.code,
    });
  }
};

module.exports = {
  getPlans: handle(() => service.listPlans()),
  getMe: handle((req) => service.getMySubscription(req.user)),
  createCheckout: handle((req) => service.createCheckout(req.user, req.body && req.body.planId)),
  confirmPayment: handle((req) => service.confirmPayment(req.user, req.params.txnId, req.body)),
  cancel: handle((req) => service.cancelSubscription(req.user)),
  reactivate: handle((req) => service.reactivateSubscription(req.user)),
  setAutoRenewal: handle((req) => service.setAutoRenewal(req.user, req.body && req.body.autoRenewal)),
  resendReceipt: handle((req) => service.resendReceipt(req.user, req.params.txnId)),
  contactSales: handle((req) => service.contactSales(req.body, req.user || null)),
};