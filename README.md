# Website Automation Testing

Production: https://automation-test-one.vercel.app/

Full-stack platform for creating, running, and analyzing browser automation tests with AI-assisted generation and an agent-worker execution service.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 7, Tailwind CSS, shadcn-style UI components |
| Backend | Node.js 20, Express 5, PostgreSQL, JWT auth |
| Agent worker | FastAPI, Playwright/browser-use |
| AI providers | Gemini, OpenAI, Ollama support |
| Deployment | Docker, Azure App Service, Azure Container Instance, Render/Vercel docs |

## Repository Layout

```text
automation-test/
├── client/                 # React/Vite web app
├── server/                 # Express API, modules, migrations, Dockerfile
├── agent-worker/           # FastAPI browser agent service
├── automation/             # Legacy/local Selenium runner utilities
├── server/migrations/      # Incremental database migrations
├── migrate-production.sh   # Full schema + incremental migration runner
├── .github/workflows/      # Azure deployment workflows
├── docker-compose.yml      # Local PostgreSQL only
└── docker-compose.prod.yml # Backend + agent-worker production compose
```

## Prerequisites

- Node.js 20+ recommended
- PostgreSQL 16+
- Python 3.11+ for `agent-worker`
- Docker, if using the containerized path
- Google OAuth Web Client ID, if enabling Google login

## Environment

The backend and frontend both read environment variables from the project-root `.env`.

```bash
cp .env.local.example .env
```

Important variables:

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | server | Cloud PostgreSQL connection string. Overrides `DB_*`. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | server | Local PostgreSQL fallback. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | server | JWT signing and expiry. |
| `GOOGLE_CLIENT_ID` | server | Verifies Google login tokens. |
| `VITE_API_URL` | client | API base URL. Defaults to `/api`. |
| `VITE_GOOGLE_CLIENT_ID` | client | Enables the Google login popup. Use the same Web Client ID. |
| `GEMINI_API_KEY`, `OPENAI_API_KEY` | server/worker | AI provider credentials. |
| `AGENT_WORKER_BASE_URL` | server | Agent worker base URL, usually `http://localhost:8001`. |
| `AGENT_CALLBACK_SECRET` | server/worker | Shared secret for worker callbacks. |
| `NODE_CALLBACK_BASE_URL` | worker | Backend callback base URL, e.g. `http://localhost:5000/api`. |
| `SMTP_*`, `MAIL_FROM` | server | Password reset OTP email. |

For Google login, configure the OAuth client with authorized JavaScript origins such as:

- `http://localhost:5173`
- your production frontend domain

## Local Setup

Install dependencies:

```bash
cd client && npm install
cd ../server && npm install
```

Optional agent-worker setup:

```bash
cd agent-worker
python3.11 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
playwright install chromium
```

## Database

For local PostgreSQL through Docker:

```bash
docker compose up -d postgres
```

Create a fresh local database manually if you are not using Docker:

```bash
createdb automation_test
```

Run the full schema/migration chain from the project root:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?sslmode=require" ./migrate-production.sh
```

For a local database without SSL:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/automation_test" ./migrate-production.sh
```

To apply only the Google OAuth migration to an already up-to-date database:

```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?sslmode=require" -f server/migrations/024_google_oauth.sql
```

See [server/migrations/migration-order.md](server/migrations/migration-order.md) before resetting or rebuilding production-like databases.

## Run Locally

Start the backend:

```bash
cd server
npm run dev
```

Backend runs on `http://localhost:5000` by default.

Start the frontend:

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173`. Vite proxies `/api` to `http://localhost:${PORT || 5000}` in development.

Start the agent worker when running agent/test execution flows:

```bash
cd agent-worker
source venv/bin/activate
uvicorn app.main:app --port 8001 --reload
```

## API

All backend API routes are prefixed with `/api`.

| Route prefix | Purpose |
| --- | --- |
| `/api/health` | Database-backed health check |
| `/api/auth` | Email/password auth, Google login, password reset, onboarding |
| `/api/dashboard` | Dashboard metrics |
| `/api/projects` | Project CRUD and settings |
| `/api/scans` | Website scan/crawl orchestration |
| `/api/test-cases` | Test case CRUD and AI-assisted flows |
| `/api/test-runs` | Test run execution/results |
| `/api/test-suites` | Test suite/test sheet management |
| `/api/test-suite-runs` | Suite run execution/results |
| `/api/test-collections` | Test collection hierarchy |
| `/api/datasets` | Test data/dataset management |
| `/api/projects/:projectId/test-objects` | Object repository |
| `/api/agent` | Agent-worker callbacks and orchestration |

Swagger UI is available only when `NODE_ENV !== "production"`:

```text
http://localhost:5000/api-docs
http://localhost:5000/api-docs.json
```

Protected API routes use `Authorization: Bearer <token>`.

## Scripts

Frontend:

```bash
cd client
npm run dev
npm run build
npm run lint
npm run preview
```

Backend:

```bash
cd server
npm run dev
npm start
```

Agent worker:

```bash
cd agent-worker
uvicorn app.main:app --port 8001
```

## Deployment

Detailed Render/Vercel notes live in [DEPLOYMENT.md](DEPLOYMENT.md).

Azure workflows:

- Backend API: [.github/workflows/deploy-backend.yml](.github/workflows/deploy-backend.yml), triggered by pushes to `production/backend-api`, builds `backend-api` and updates the Azure App Service image.
- Agent worker: [.github/workflows/deploy.yml](.github/workflows/deploy.yml), triggered by pushes to `production/agent-worker`, deploys the worker to Azure Container Instance and points callbacks at the backend App Service.

Required GitHub Actions secrets for backend deploy include:

```text
AZURE_CREDENTIALS
ACR_USERNAME
ACR_PASSWORD
```

Backend runtime settings such as `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GEMINI_API_KEY`, `AGENT_CALLBACK_SECRET`, and SMTP credentials should be configured in the Azure App Service environment/configuration. The backend workflow updates the container image; it no longer recreates the old `backend-api` ACI container.

## Notes

- Backend env is loaded from the repository root `.env`.
- Client Vite config uses `envDir: ..`, so `VITE_*` values also come from the root `.env`.
- API docs are intentionally hidden in production.
- `migrate-production.sh` applies `Automation_testing_DB.sql` as the base schema and then guarded incremental migrations.
