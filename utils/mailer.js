const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

});

async function sendOtpEmail(toEmail, otp) {
  await transporter.sendMail({
    from: `"Aperture X Studios" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Your Aperture X Studios login code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#0ea5e9;">Your login code</h2>
        <p>Use this code to finish logging in. It expires in 5 minutes.</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #020617;">${otp}</p>
        <p style="color: #888; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
    text: `Your login code is: ${otp} (expires in 5 minutes)`,
  });
}

const ROLE_LABELS = {
  studio_manager: "Studio Manager",
  studio_photographer: "Studio Photographer",
};

async function sendInviteEmail(toEmail, inviteLink, role, studioName) {
  const roleLabel = ROLE_LABELS[role] || "team member";
  const studioText = studioName ? ` at <strong>${studioName}</strong>` : "";

  await transporter.sendMail({
    from: `"Aperture X Studios" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `You've been invited to join as a ${roleLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#0ea5e9;">You're invited</h2>
        <p>You've been invited to join${studioText} as a <strong>${roleLabel}</strong> on Aperture X Studios.</p>
        <p>
          <a href="${inviteLink}" style="display:inline-block; padding: 12px 24px; background: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Accept Invite
          </a>
        </p>
        <p style="color: #888; font-size: 12px;">This invite link expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
      </div>
    `,
    text: `You've been invited to join${studioText.replace(/<\/?strong>/g, "")} as a ${roleLabel}. Accept here: ${inviteLink} (expires in 7 days)`,
  });
}

/**
 * Sends a subscription payment receipt email.
 * `receipt` shape (matches the frontend's PaidReceipt):
 * {
 *   transactionId: string,
 *   plan: { name: string, billingCycle: "monthly"|"yearly", features: string[] },
 *   amount: number,
 *   currencySymbol: string,
 *   paidAt: string,        // ISO timestamp
 *   userName?: string,
 * }
 */
async function sendReceiptEmail(toEmail, receipt) {
  const {
    transactionId,
    plan,
    amount,
    currencySymbol = "₹",
    paidAt,
    userName,
  } = receipt;

  const paidOn = new Date(paidAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const featuresHtml = (plan.features || [])
    .map(
      (f) =>
        `<li style="padding:4px 0; color:#334155; font-size:13px;">✓ ${f}</li>`
    )
    .join("");

  const greeting = userName ? `Hi ${userName},` : "Hi,";

  await transporter.sendMail({
    from: `"Aperture X Studios" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Payment received — ${plan.name} subscription confirmed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color:#0ea5e9; margin-bottom: 4px;">Payment confirmed</h2>
        <p style="color:#334155;">${greeting} your <strong>${plan.name}</strong> subscription is now active.</p>

        <div style="border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin:20px 0;">
          <table style="width:100%; border-collapse:collapse; font-size:13px; color:#334155;">
            <tr>
              <td style="padding:6px 0; color:#94a3b8;">Transaction ID</td>
              <td style="padding:6px 0; text-align:right; font-weight:bold;">${transactionId}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#94a3b8;">Plan</td>
              <td style="padding:6px 0; text-align:right;">${plan.name}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#94a3b8;">Billing Cycle</td>
              <td style="padding:6px 0; text-align:right;">${plan.billingCycle}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#94a3b8;">Amount Paid</td>
              <td style="padding:6px 0; text-align:right; font-weight:bold;">${currencySymbol}${amount.toLocaleString(
      "en-IN"
    )}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#94a3b8;">Paid On</td>
              <td style="padding:6px 0; text-align:right;">${paidOn}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#94a3b8;">Status</td>
              <td style="padding:6px 0; text-align:right; color:#16a34a; font-weight:bold;">PAID</td>
            </tr>
          </table>
        </div>

        <p style="color:#334155; font-size:13px; font-weight:bold; margin-bottom:4px;">Plan includes</p>
        <ul style="list-style:none; padding:0; margin:0 0 20px;">${featuresHtml}</ul>

        <p style="color: #888; font-size: 12px;">A downloadable PDF of this receipt is also available from your account under Subscription. If you didn't make this payment, contact us immediately.</p>
      </div>
    `,
    text: `Payment confirmed for ${plan.name}. Transaction ID: ${transactionId}. Amount: ${currencySymbol}${amount}. Paid on: ${paidOn}. Status: PAID.`,
  });
}

module.exports = { sendOtpEmail, sendInviteEmail, sendReceiptEmail };