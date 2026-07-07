# Deployment Guide

Stack: **Neon (PostgreSQL)** · **Render (Backend + Agent Worker)** · **Vercel (Frontend)**

---

## Prerequisites

- [Neon](https://neon.tech) account — PostgreSQL database
- [Render](https://render.com) account — backend + agent-worker hosting
- [Vercel](https://vercel.com) account — frontend hosting
- `psql` CLI installed locally (for running migrations)
- Docker (optional, for local production test)

---

## 1. Database — Neon

1. Create a new project on [console.neon.tech](https://console.neon.tech).
2. Copy the connection string from the dashboard:
   ```
   postgresql://neondb_owner:<password>@<host>.neon.tech/neondb?sslmode=require
   ```
3. Save this as `DATABASE_URL`.

### Run Migrations

```bash
export DATABASE_URL="postgresql://neondb_owner:<password>@<host>.neon.tech/neondb?sslmode=require"
./migrate-production.sh
```

The script runs all 14 migrations in the correct order. Safe to re-run — all SQL uses `IF NOT EXISTS`.

See `server/migrations/migration-order.md` for the manual order if needed.

---

## 2. Backend — Render

### Option A: Docker (recommended)

1. Push your repo to GitHub.
2. In Render dashboard → **New → Web Service** → connect GitHub repo.
3. Set:
   - **Runtime:** Docker
   - **Dockerfile path:** `./server/Dockerfile`
   - **Docker context:** `./server`
   - **Plan:** Starter ($7/mo) or Free (spins down after inactivity)
4. Add environment variables (Render dashboard → Environment):

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `DATABASE_URL` | _(your Neon URL)_ |
   | `JWT_SECRET` | _(generate: `openssl rand -hex 64`)_ |
   | `GOOGLE_CLIENT_ID` | _(Google OAuth Web client ID)_ |
   | `GEMINI_API_KEY` | _(your key)_ |
   | `LLM_PROVIDER` | `gemini` |
   | `LLM_MODEL` | `gemini-2.5-flash` |
   | `AGENT_WORKER_BASE_URL` | _(agent-worker Render URL — set after step 3)_ |
   | `AGENT_CALLBACK_SECRET` | _(generate: `openssl rand -hex 32`)_ |
   | `SERVER_BASE_URL` | _(this service's URL, e.g. `https://automation-test-backend.onrender.com`)_ |
   | `SCREENSHOTS_DIR` | `/app/screenshots` |

5. Add a **Disk** (Render dashboard → Disks): mount at `/app/screenshots`, 5 GB.

### Option B: Blueprint (render.yaml)

```bash
# Push to GitHub, then in Render:
# New → Blueprint → connect repo → render.yaml is auto-detected
```

The `render.yaml` at the project root defines both backend and agent-worker services.

---

## 3. Agent Worker — Render

The agent-worker runs Python + Playwright + Chromium. It requires a **paid plan** (Standard, $25/mo)
because Chromium needs at least 512MB RAM.

1. In Render dashboard → **New → Web Service** → connect GitHub repo.
2. Set:
   - **Runtime:** Docker
   - **Dockerfile path:** `./agent-worker/Dockerfile`
   - **Docker context:** `./agent-worker`
   - **Plan:** Standard
3. Add environment variables:

   | Variable | Value |
   |---|---|
   | `NODE_CALLBACK_BASE_URL` | `https://your-backend.onrender.com/api` |
   | `AGENT_CALLBACK_SECRET` | _(same as backend's `AGENT_CALLBACK_SECRET`)_ |
   | `GEMINI_API_KEY` | _(your key)_ |
   | `EXECUTION_LLM_PROVIDER` | `gemini` |
   | `EXECUTION_LLM_MODEL` | `gemini-2.5-flash` |
   | `EXECUTION_HEADLESS` | `true` |
   | `EXECUTION_MAX_STEPS` | `20` |
   | `EXECUTION_TIMEOUT_SECONDS` | `300` |
   | `WORKER_MAX_CONCURRENCY` | `2` |
   | `SCREENSHOTS_DIR` | `/app/screenshots` |

4. Add a **Disk**: mount at `/app/screenshots`, 5 GB.
5. After deploy, copy this service's URL and set it as `AGENT_WORKER_BASE_URL` in the backend service.

### VPS Alternative (cheaper)

If you want to avoid Render's $25/mo for the agent-worker:

```bash
# On your VPS (Ubuntu 22.04):
git clone <repo>
cd automation-test/agent-worker
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
playwright install chromium --with-deps

# Create .env
cp ../.env.production.example .env
# Edit .env: set NODE_CALLBACK_BASE_URL, GEMINI_API_KEY, etc.

# Run with systemd or screen:
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Then expose port 8001 (or put behind nginx with HTTPS).

---

## 4. Frontend — Vercel

1. Push repo to GitHub.
2. In Vercel dashboard → **New Project** → import GitHub repo.
3. Set:
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variables (Vercel → Project Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-backend.onrender.com/api` |
   | `VITE_GOOGLE_CLIENT_ID` | _(same Google OAuth Web client ID)_ |
   | `VITE_APP_NAME` | `AutomationTest` |
   | `VITE_ENV` | `production` |

   > **Important:** Vite bakes these values into the static bundle at build time.
   > After changing them you must trigger a redeploy.

5. Deploy. Vercel auto-deploys on every push to `main`.

---

## 5. Post-Deploy Checklist

After all three services are live, verify the system:

```bash
# 1. Backend health
curl https://your-backend.onrender.com/api/health

# 2. Agent worker health
curl https://your-agent-worker.onrender.com/health

# 3. Database connectivity (backend should say DB is connected)
# Check backend logs in Render dashboard

# 4. Frontend loads
# Open https://your-app.vercel.app in browser

# 5. Create a test account via /signup

# 6. Create a project, add a test case, run it
# → Should trigger agent-worker, which POSTs results back to backend
```

---

## 6. Environment Variables Cross-Reference

| Variable | Backend | Agent Worker | Frontend (Vite) |
|---|---|---|---|
| `DATABASE_URL` | ✅ required | — | — |
| `JWT_SECRET` | ✅ required | — | — |
| `GOOGLE_CLIENT_ID` | ✅ required for Google login | — | — |
| `GEMINI_API_KEY` | ✅ required | ✅ required | — |
| `OPENAI_API_KEY` | optional | optional | — |
| `LLM_PROVIDER` | ✅ | — | — |
| `LLM_MODEL` | ✅ | — | — |
| `EXECUTION_LLM_PROVIDER` | — | ✅ | — |
| `EXECUTION_LLM_MODEL` | — | ✅ | — |
| `AGENT_WORKER_BASE_URL` | ✅ required | — | — |
| `AGENT_CALLBACK_SECRET` | ✅ required | ✅ required | — |
| `NODE_CALLBACK_BASE_URL` | — | ✅ required | — |
| `SERVER_BASE_URL` | ✅ required | — | — |
| `SCREENSHOTS_DIR` | ✅ | ✅ | — |
| `VITE_API_URL` | — | — | ✅ required |
| `VITE_GOOGLE_CLIENT_ID` | — | — | ✅ required for Google login |

---

## 7. Secrets Generation

```bash
# JWT_SECRET (64 chars)
openssl rand -hex 64

# AGENT_CALLBACK_SECRET (32 chars)
openssl rand -hex 32
```

---

## 8. Updating After Code Changes

```bash
# Backend / Agent Worker: push to GitHub → Render auto-deploys

# Frontend: push to GitHub → Vercel auto-deploys

# New migration added: re-run migrate-production.sh
export DATABASE_URL="..."
./migrate-production.sh
```
