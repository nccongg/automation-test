'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');
const env = require('../../config/env');
const { sendOtpEmail } = require('../../config/mailer');

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 */
async function register({ email, password, name }) {
  if (!email || !password) {
    throw { status: 400, message: 'Email and password are required' };
  }
  if (password.length < 8) {
    throw { status: 400, message: 'Password must be at least 8 characters long' };
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) {
    throw { status: 409, message: 'Email already registered' };
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
    [email, hashedPassword, name]
  );

  return result.rows[0];
}

/**
 * Login a user.
 */
async function login({ email, password }) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

// Generic response used for forgot-password to avoid leaking which emails exist.
const FORGOT_PASSWORD_MESSAGE =
  'If an account exists for that email, a reset code has been sent.';

/**
 * Send an OTP for the forgot-password flow.
 * Always returns the same generic message to prevent email enumeration.
 */
async function forgotPassword({ email }) {
  if (!email) throw { status: 400, message: 'Email is required' };

  const result = await query('SELECT id FROM users WHERE email = $1', [email]);

  // Only generate/send a code when the account actually exists, but respond
  // identically either way.
  if (result.rows.length) {
    // 5-digit code to match the verification UI.
    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const otpHash = await bcrypt.hash(otpCode, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + env.OTP_EXP_MINUTES * 60 * 1000);

    // Invalidate any previous unused codes for this email.
    await query(
      'UPDATE password_reset_otps SET used = TRUE WHERE email = $1 AND used = FALSE',
      [email]
    );

    await query(
      'INSERT INTO password_reset_otps (email, otp_hash, expires_at) VALUES ($1, $2, $3)',
      [email, otpHash, expiresAt]
    );

    try {
      const info = await sendOtpEmail(email, otpCode);
      // When SMTP isn't configured the mailer no-ops — log the code so dev still works.
      if (info && info.skipped) {
        console.log(`[AUTH] OTP for ${email}: ${otpCode} (valid ${env.OTP_EXP_MINUTES}m)`);
      }
    } catch (err) {
      console.error(`[AUTH] Failed to send OTP email to ${email}:`, err.message);
      throw { status: 502, message: 'Failed to send reset code. Please try again.' };
    }
  }

  return { message: FORGOT_PASSWORD_MESSAGE };
}

/**
 * Verify an OTP and return a short-lived reset token.
 */
async function verifyOtp({ email, otp }) {
  if (!email || !otp) {
    throw { status: 400, message: 'Email and code are required' };
  }

  const result = await query(
    `SELECT id, otp_hash, expires_at
       FROM password_reset_otps
      WHERE email = $1 AND used = FALSE
      ORDER BY created_at DESC
      LIMIT 1`,
    [email]
  );

  const record = result.rows[0];
  if (!record) {
    throw { status: 400, message: 'Invalid or expired code' };
  }

  if (new Date(record.expires_at) < new Date()) {
    throw { status: 400, message: 'Code has expired. Please request a new one.' };
  }

  const isMatch = await bcrypt.compare(otp, record.otp_hash);
  if (!isMatch) {
    throw { status: 400, message: 'Invalid or expired code' };
  }

  // Consume the code so it can't be reused.
  await query('UPDATE password_reset_otps SET used = TRUE WHERE id = $1', [record.id]);

  const resetToken = jwt.sign(
    { email, type: 'reset' },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return { resetToken };
}

/**
 * Reset password using the reset token.
 */
async function resetPassword({ resetToken, newPassword }) {
  if (!resetToken || !newPassword) {
    throw { status: 400, message: 'Reset token and new password are required' };
  }
  if (newPassword.length < 8) {
    throw { status: 400, message: 'Password must be at least 8 characters long' };
  }

  let decoded;
  try {
    decoded = jwt.verify(resetToken, env.JWT_SECRET);
  } catch (err) {
    throw { status: 401, message: 'Invalid or expired reset token' };
  }

  if (decoded.type !== 'reset') {
    throw { status: 401, message: 'Invalid or expired reset token' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const result = await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
    [hashedPassword, decoded.email]
  );

  if (result.rowCount === 0) {
    throw { status: 404, message: 'User not found' };
  }

  return { message: 'Password reset successful' };
}

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
