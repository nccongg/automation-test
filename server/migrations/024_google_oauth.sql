-- =========================================================
-- 024) GOOGLE OAUTH LOGIN
-- Allows Google-only accounts and links verified Google
-- identities to existing email/password users.
-- =========================================================

ALTER TABLE IF EXISTS users
    ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255),
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(30) NOT NULL DEFAULT 'email';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub
    ON users (google_sub)
    WHERE google_sub IS NOT NULL;
