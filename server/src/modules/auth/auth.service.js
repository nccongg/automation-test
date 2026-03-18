'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');
const env = require('../../config/env');

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 */
async function register({ email, password, name }) {
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

/**
 * Send OTP for forgot password.
 */
async function forgotPassword({ email }) {
  const result = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (!result.rows.length) {
    // We don't want to leak if an email exists, but for now we follow the user request
    throw { status: 404, message: 'User not found' };
  }

  // Generate a random 5-digit code
  const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
  
  // In a real app, store this in DB/Redis with expiry and send email.
  // For this automation-test project, we just log it.
  console.log(`[AUTH] OTP generated for ${email}: ${otpCode}`);

  return { message: 'OTP sent to your email' };
}

/**
 * Verify OTP and return a reset token.
 */
async function verifyOtp({ email, code }) {
  // Mock verification - always succeed if code is provided
  if (!code) throw { status: 400, message: 'OTP code is required' };

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
  try {
    const decoded = jwt.verify(resetToken, env.JWT_SECRET);
    if (decoded.type !== 'reset') throw new Error('Invalid token type');

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, decoded.email]);

    return { message: 'Password reset successful' };
  } catch (err) {
    throw { status: 401, message: 'Invalid or expired reset token' };
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
