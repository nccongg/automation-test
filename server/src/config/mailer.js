'use strict';

const nodemailer = require('nodemailer');
const env = require('./env');

let transporter = null;

/**
 * Lazily build the SMTP transporter. Returns null when SMTP isn't configured
 * so the caller can degrade gracefully (e.g. log the OTP in development).
 */
function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });

  return transporter;
}

/**
 * Send an email. When SMTP isn't configured this is a no-op (logs a warning)
 * so local/dev flows keep working without a mail server.
 */
async function sendMail({ to, subject, html, text }) {
  const tx = getTransporter();
  if (!tx) {
    console.warn(`[MAIL] SMTP not configured — skipping email to ${to} (subject: "${subject}")`);
    return { skipped: true };
  }

  return tx.sendMail({ from: env.MAIL_FROM, to, subject, html, text });
}

/**
 * Send a password-reset OTP email.
 */
async function sendOtpEmail(to, otp) {
  const minutes = env.OTP_EXP_MINUTES;
  const subject = `${env.APP_NAME} — your password reset code`;
  const text =
    `Your ${env.APP_NAME} password reset code is ${otp}.\n` +
    `It expires in ${minutes} minutes. If you didn't request this, ignore this email.`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b">
      <h2 style="margin:0 0 16px">Reset your password</h2>
      <p style="margin:0 0 16px;color:#475569">
        Use the code below to reset your ${env.APP_NAME} password. It expires in
        <strong>${minutes} minutes</strong>.
      </p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;
                  padding:16px;background:#f1f5f9;border-radius:12px;color:#0f172a">
        ${otp}
      </div>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:13px">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>`;

  return sendMail({ to, subject, html, text });
}

module.exports = { sendMail, sendOtpEmail, getTransporter };
