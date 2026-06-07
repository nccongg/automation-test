# Production Audit

## Issues Found and Fixed

### ✅ Fixed: DATABASE_URL support for Neon/cloud PostgreSQL
- **File:** `server/src/config/database.js`
- **Change:** When `DATABASE_URL` env var is set, the `pg.Pool` now uses a connection string
  with `ssl: { rejectUnauthorized: false }`. Falls back to individual `DB_*` params for local dev.
- **Why:** Neon requires SSL and uses a connection string. The old code only supported host/port/user/pass.

### ✅ Fixed: `DB_SSL` flag added to env config
- **File:** `server/src/config/env.js`
- **Change:** Added `DB_SSL`, `DATABASE_URL`, `OPENAI_API_KEY`, `SERVER_BASE_URL` to env schema.

### ✅ Fixed: Vite proxy port mismatch (dev only)
- **File:** `client/vite.config.js`
- **Change:** Proxy target now reads `process.env.PORT` so it matches whatever port the server runs on.
- **Why:** The hardcoded `5000` did not match the running server when `PORT=3001` was set in `.env`.

### ✅ Fixed: Server startup log used `localhost` (cosmetic)
- **File:** `server/src/app.js`
- **Change:** Startup log no longer says `http://localhost:PORT`; instead says `port X` and shows
  DATABASE_URL or host/port depending on which is active.

---

## Remaining Issues — Require Manual Action

### ⚠️ agent-worker/app/main.py: .env path loads from project root
- **Location:** `agent-worker/app/main.py:11` — `load_dotenv(BASE_DIR.parent / ".env")`
- **Impact:** In Docker/Render the project root `.env` won't be present inside the container.
- **Mitigation:** All env vars are passed via Docker/Render env, so `load_dotenv` silently no-ops.
  No code change needed, but be aware there is no fallback `.env` in production containers.

### ⚠️ agent-worker: NODE_CALLBACK_BASE_URL default is `http://localhost:5000/api`
- **Location:** `agent-worker/app/callbacks.py:13`
- **Impact:** Default only works in local dev. In production you **must** set `NODE_CALLBACK_BASE_URL`
  to your backend's public URL (e.g. `https://your-backend.onrender.com/api`).
- **Status:** Documented in `.env.production.example` and `DEPLOYMENT.md`. Default is intentionally
  kept as-is so local dev still works without setting this var.

### ⚠️ server: SERVER_BASE_URL default is `http://localhost:{PORT}`
- **Location:** `server/src/modules/scan/scan.service.js:124`
- **Impact:** When the server dispatches a crawl, the callback URL it sends to the agent-worker
  defaults to `http://localhost:PORT`. In production this must be set via `SERVER_BASE_URL` env var.
- **Action:** Set `SERVER_BASE_URL=https://your-backend.onrender.com` in production.

### ⚠️ JWT_SECRET defaults to `"secret"`
- **Location:** `server/src/config/env.js`
- **Impact:** Using the default in production would allow anyone to forge JWT tokens.
- **Action:** Always set a strong `JWT_SECRET` (≥64 random chars) via env var in production.
  The `render.yaml` uses `generateValue: true` to auto-generate this on Render.

### ⚠️ CORS is open (`app.use(cors())`)
- **Location:** `server/src/app.js:31`
- **Impact:** Any origin can call the API. Acceptable for development, but for production
  you should restrict to your frontend's domain.
- **Action (optional):** Change to:
  ```js
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  ```
  Then set `CORS_ORIGIN=https://your-frontend.vercel.app` in production env.

### ⚠️ agent-worker CORS allows all origins
- **Location:** `agent-worker/app/main.py:35` — `allow_origins=["*"]`
- **Impact:** If the agent-worker is publicly accessible, any site can call it.
- **Recommendation:** Put agent-worker behind a private network or restrict `allow_origins`
  to the server's IP/URL.

### ⚠️ Screenshots served without authentication
- **Location:** `server/src/app.js` — `/screenshots/:fileName` endpoint is public
- **Impact:** Anyone with the filename can download screenshots.
- **Recommendation:** Add auth middleware to the screenshots endpoint if files are sensitive.

### ⚠️ Vercel deployment: VITE_API_URL must be set at build time
- **How Vercel builds:** `vite build` bakes `import.meta.env.VITE_API_URL` into the JS bundle.
- **Action:** In Vercel project settings → Environment Variables, set:
  `VITE_API_URL=https://your-backend.onrender.com/api`

### ⚠️ agent-worker `requirements.txt` has no pinned versions
- **Location:** `agent-worker/requirements.txt`
- **Impact:** A future `pip install` may pull a breaking version of `browser-use` or `playwright`.
- **Recommendation:** Pin versions after confirming a working set:
  ```
  pip freeze > requirements-lock.txt
  ```
  Use that for production Docker builds.

### ⚠️ Two migration files share prefix `009_`
- **Files:** `009_ai_generation_persistence.sql` and `009_test_objects.sql`
- **Action:** See `server/migrations/migration-order.md` for correct run order.
  Use `migrate-production.sh` which handles this automatically.
