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

module.exports = { sendOtpEmail };
