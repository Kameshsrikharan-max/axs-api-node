const nodemailer = require("nodemailer");

// Reuse the existing mailer if it exposes a generic sendMail / transporter,
// otherwise fall back to SMTP_* (or EMAIL_*) env vars.
let existing = null;
try {
  existing = require("./mailer");
} catch (_) {
  existing = null;
}

let fallbackTransport = null;
const getSender = () => {
  if (existing && typeof existing.sendMail === "function") return (o) => existing.sendMail(o);
  if (existing && existing.transporter && typeof existing.transporter.sendMail === "function") {
    return (o) => existing.transporter.sendMail(o);
  }
  if (!fallbackTransport) {
    const port = Number(process.env.SMTP_PORT || 587);
    // 465 = implicit TLS, 587 = STARTTLS (secure must be false)
    const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
    fallbackTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        // Gmail app passwords are shown with spaces; they must be sent without
        pass: String(process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
      },
    });
  }
  return (o) => fallbackTransport.sendMail(o);
};

const FROM = () =>
  process.env.MAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@axs.studio";

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const fmtDate = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

const money = (symbol, n) => `${symbol}${Number(n).toLocaleString("en-IN")}`;

async function sendReceiptEmail({ to, receipt, cycleEnd }) {
  const p = receipt.plan;
  const rows = [
    ["Invoice No.", receipt.invoiceNo],
    ["Transaction ID", receipt.transactionId],
    ["Plan", `${p.name} (${p.billingCycle})`],
    ["Amount Paid", money(receipt.currencySymbol, receipt.amount)],
    ["Paid On", fmtDate(receipt.paidAt)],
    cycleEnd ? ["Valid Until", fmtDate(cycleEnd)] : null,
    ["Status", "PAID"],
  ].filter(Boolean);

  const html = `
  <div style="font-family:Arial,sans-serif;background:#0b1626;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#0f1b2e;border:1px solid #1d4a6b;border-radius:16px;overflow:hidden">
      <div style="padding:22px 26px;background:#091425">
        <div style="color:#38d5ff;font-size:11px;letter-spacing:3px">AXS STUDIO</div>
        <div style="color:#fff;font-size:22px;font-weight:700;margin-top:6px">Payment Receipt</div>
      </div>
      <div style="padding:22px 26px;color:#cbd8e7;font-size:14px">
        <p style="margin:0 0 16px">Hi ${esc(receipt.userName || "there")}, thanks for subscribing to <b>${esc(p.name)}</b>.</p>
        <table style="width:100%;border-collapse:collapse">
          ${rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:8px 0;color:#6e839d;width:40%">${esc(k)}</td><td style="padding:8px 0;color:#edf8ff;font-weight:600">${esc(v)}</td></tr>`
            )
            .join("")}
        </table>
        <p style="margin:18px 0 6px;color:#6e839d;font-size:12px;letter-spacing:1px">PLAN INCLUDES</p>
        <ul style="margin:0;padding-left:18px">${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        <p style="margin:22px 0 0;color:#6e839d;font-size:12px">This is a system-generated receipt from AXS Studio.</p>
      </div>
    </div>
  </div>`;

  await getSender()({
    from: FROM(),
    to,
    subject: `AXS Studio receipt ${receipt.invoiceNo} - ${p.name}`,
    html,
  });
}

async function sendSalesLeadEmail({ to, lead }) {
  const html = `
  <div style="font-family:Arial,sans-serif;font-size:14px">
    <h3>New enterprise enquiry</h3>
    <p><b>Name:</b> ${esc(lead.name)}<br/><b>Email:</b> ${esc(lead.email)}<br/><b>Phone:</b> ${esc(lead.phone || "-")}</p>
    <p>${esc(lead.message || "(no message)")}</p>
  </div>`;
  await getSender()({ from: FROM(), to, subject: "AXS Studio - new Contact Sales enquiry", html, replyTo: lead.email });
}

module.exports = { sendReceiptEmail, sendSalesLeadEmail };