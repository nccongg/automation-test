-- =========================================================
-- 018) PASSWORD RESET OTPs
-- Stores hashed one-time codes for the forgot-password flow.
-- =========================================================

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    otp_hash    TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email
    ON password_reset_otps (email);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at
    ON password_reset_otps (expires_at);
