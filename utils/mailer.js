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

module.exports = { sendOtpEmail, sendInviteEmail };