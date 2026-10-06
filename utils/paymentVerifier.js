// Payment verification seam.
//
// A static UPI QR (upi://pay?...) gives the server NO signal that money moved,
// so a "tap to confirm" click cannot be trusted in production. Real verification
// needs a gateway (Razorpay / Cashfree / PhonePe) that calls a webhook or returns
// a signed payload. Plug that in here; the rest of the backend does not change.
//
// PAYMENT_MODE=simulated (default) -> accepts the confirm call (dev/demo only)

async function verify(payment /*, proof */) {
  const mode = (process.env.PAYMENT_MODE || "simulated").toLowerCase();

  if (mode === "simulated") {
    const blocked =
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_SIMULATED_PAYMENTS !== "true";
    if (blocked) {
      return { ok: false, reason: "Simulated payments are disabled in production" };
    }
    return { ok: true, gatewayRef: `SIM-${payment.txnId}` };
  }

  return { ok: false, reason: `Payment mode "${mode}" is not implemented` };
}

module.exports = { verify };