'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { query } = require('../../config/database');
const env = require('../../config/env');
const { sendOtpEmail } = require('../../config/mailer');

const SALT_ROUNDS = 10;
let googleClient;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getGoogleClient() {
  if (!env.GOOGLE_CLIENT_ID) {
    throw { status: 503, message: 'Google sign-in is not configured' };
  }
  if (!googleClient) {
    googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url || null,
    auth_provider: user.auth_provider || 'email',
    onboarding_completed: user.onboarding_completed ?? false,
  };
}

function createAuthSession(user) {
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: toPublicUser(user),
  };
}

/**
 * Register a new user.
 */
async function register({ email, password, name }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    throw { status: 400, message: 'Email and password are required' };
  }
  if (password.length < 8) {
    throw { status: 400, message: 'Password must be at least 8 characters long' };
  }

  const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
  if (existing.rows.length) {
    throw { status: 409, message: 'Email already registered' };
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
    [normalizedEmail, hashedPassword, name]
  );

  return result.rows[0];
}

/**
 * Login a user.
 */
async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    throw { status: 400, message: 'Email and password are required' };
  }

  const result = await query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
  const user = result.rows[0];

  if (!user) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  if (!user.password_hash) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  return createAuthSession(user);
}

async function verifyGoogleCredential(credential) {
  if (!credential) {
    throw { status: 400, message: 'Google credential is required' };
  }

  let ticket;
  try {
    ticket = await getGoogleClient().verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    console.warn('[AUTH] Invalid Google credential:', err.message);
    throw { status: 401, message: 'Invalid Google credential' };
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload?.email) {
    throw { status: 401, message: 'Invalid Google credential' };
  }
  if (payload.email_verified !== true) {
    throw { status: 401, message: 'Google email is not verified' };
  }

  return {
    googleSub: payload.sub,
    email: normalizeEmail(payload.email),
    name: payload.name || payload.given_name || payload.email.split('@')[0],
    avatarUrl: payload.picture || null,
  };
}

async function verifyGoogleAccessToken(accessToken) {
  if (!accessToken) {
    throw { status: 400, message: 'Google access token is required' };
  }

  let tokenInfo;
  try {
    tokenInfo = await getGoogleClient().getTokenInfo(accessToken);
  } catch (err) {
    console.warn('[AUTH] Invalid Google access token:', err.message);
    throw { status: 401, message: 'Invalid Google access token' };
  }

  if (tokenInfo.aud !== env.GOOGLE_CLIENT_ID) {
    throw { status: 401, message: 'Invalid Google access token audience' };
  }
  if (!tokenInfo.sub || !tokenInfo.email) {
    throw { status: 401, message: 'Invalid Google access token' };
  }
  if (tokenInfo.email_verified !== true && tokenInfo.email_verified !== 'true') {
    throw { status: 401, message: 'Google email is not verified' };
  }

  let userInfo = null;
  try {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      userInfo = await response.json();
    }
  } catch (err) {
    console.warn('[AUTH] Could not fetch Google userinfo:', err.message);
  }

  if (userInfo?.sub && userInfo.sub !== tokenInfo.sub) {
    throw { status: 401, message: 'Invalid Google user profile' };
  }

  return {
    googleSub: tokenInfo.sub,
    email: normalizeEmail(tokenInfo.email),
    name: userInfo?.name || userInfo?.given_name || tokenInfo.email.split('@')[0],
    avatarUrl: userInfo?.picture || null,
  };
}

async function upsertGoogleUser({ googleSub, email, name, avatarUrl }) {
  const existing = await query(
    `SELECT *
       FROM users
      WHERE google_sub = $1 OR LOWER(email) = $2
      ORDER BY CASE WHEN google_sub = $1 THEN 0 ELSE 1 END
      LIMIT 1`,
    [googleSub, email]
  );

  const user = existing.rows[0];
  if (!user) {
    const created = await query(
      `INSERT INTO users (email, name, password_hash, google_sub, avatar_url, auth_provider)
       VALUES ($1, $2, NULL, $3, $4, 'google')
       RETURNING *`,
      [email, name, googleSub, avatarUrl]
    );
    return created.rows[0];
  }

  if (user.google_sub && user.google_sub !== googleSub) {
    throw { status: 409, message: 'This email is already linked to another Google account' };
  }

  const updated = await query(
    `UPDATE users
        SET google_sub = COALESCE(google_sub, $2),
            avatar_url = COALESCE(avatar_url, $3),
            auth_provider = CASE WHEN password_hash IS NULL THEN 'google' ELSE auth_provider END,
            updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
    [user.id, googleSub, avatarUrl]
  );

  return updated.rows[0];
}

async function googleLogin({ credential, accessToken }) {
  const googleProfile = credential
    ? await verifyGoogleCredential(credential)
    : await verifyGoogleAccessToken(accessToken);
  const user = await upsertGoogleUser(googleProfile);
  return createAuthSession(user);
}

// Generic response used for forgot-password to avoid leaking which emails exist.
const FORGOT_PASSWORD_MESSAGE =
  'If an account exists for that email, a reset code has been sent.';

/**
 * Send an OTP for the forgot-password flow.
 * Always returns the same generic message to prevent email enumeration.
 */
async function forgotPassword({ email }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw { status: 400, message: 'Email is required' };

  const result = await query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);

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
      [normalizedEmail]
    );

    await query(
      'INSERT INTO password_reset_otps (email, otp_hash, expires_at) VALUES ($1, $2, $3)',
      [normalizedEmail, otpHash, expiresAt]
    );

    try {
      const info = await sendOtpEmail(normalizedEmail, otpCode);
      // When SMTP isn't configured the mailer no-ops — log the code so dev still works.
      if (info && info.skipped) {
        console.log(`[AUTH] OTP for ${normalizedEmail}: ${otpCode} (valid ${env.OTP_EXP_MINUTES}m)`);
      }
    } catch (err) {
      console.error(`[AUTH] Failed to send OTP email to ${normalizedEmail}:`, err.message);
      throw { status: 502, message: 'Failed to send reset code. Please try again.' };
    }
  }

  return { message: FORGOT_PASSWORD_MESSAGE };
}

/**
 * Verify an OTP and return a short-lived reset token.
 */
async function verifyOtp({ email, otp }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !otp) {
    throw { status: 400, message: 'Email and code are required' };
  }

  const result = await query(
    `SELECT id, otp_hash, expires_at
       FROM password_reset_otps
      WHERE email = $1 AND used = FALSE
      ORDER BY created_at DESC
      LIMIT 1`,
    [normalizedEmail]
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
    { email: normalizedEmail, type: 'reset' },
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

  const resetEmail = normalizeEmail(decoded.email);
  if (!resetEmail) {
    throw { status: 401, message: 'Invalid or expired reset token' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const result = await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = $2',
    [hashedPassword, resetEmail]
  );

  if (result.rowCount === 0) {
    throw { status: 404, message: 'User not found' };
  }

  return { message: 'Password reset successful' };
}

async function completeOnboarding(userId) {
  const result = await query(
    'UPDATE users SET onboarding_completed = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id',
    [userId]
  );
  if (result.rowCount === 0) {
    throw { status: 404, message: 'User not found' };
  }
  return { message: 'Onboarding completed' };
}

module.exports = {
  register,
  login,
  googleLogin,
  forgotPassword,
  verifyOtp,
  resetPassword,
  completeOnboarding,
};
