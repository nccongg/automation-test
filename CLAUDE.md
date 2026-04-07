# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Full-stack automation testing platform with three main components:
- **client/** — React 19 frontend (Vite, JSX, Tailwind CSS, shadcn/ui)
- **server/** — Node.js/Express 5 backend (port 5000)
- **agent-worker/** — Python FastAPI agent for Selenium browser automation (port 8001)

## Development Commands

### Database (required first)
```bash
docker-compose up -d   # starts PostgreSQL on port 5432
```

### Server
```bash
cd server
npm install
npm run dev      # node --watch src/app.js (hot reload)
npm start        # production
```

### Client
```bash
cd client
npm install
npm run dev      # Vite dev server (http://localhost:5173)
npm run build
npm run lint     # ESLint
```

### Agent Worker
```bash
cd agent-worker
source venv/bin/activate          # macOS
pip install -r requirements.txt
uvicorn app.main:app --port 8001
uvicorn app.main:app --port 8001 --reload --log-level debug   # dev mode
```

## Environment Variables (server/.env)

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=automation_test
DB_USER=postgres
DB_PASSWORD=postgres
GEMINI_API_KEY=
JWT_SECRET=
AGENT_WORKER_BASE_URL=http://localhost:8001
AGENT_CALLBACK_SECRET=
```

## Architecture

### Service Communication
The server acts as the orchestration layer:
1. Client → Server (`/api/*`) — REST with JWT auth
2. Server → Agent Worker — HTTP calls to `http://localhost:8001` to start/replay runs
3. Agent Worker → Server — POST callbacks to report run results/status

Screenshots from agent runs are stored on the server filesystem and served as static files at `/screenshots/`.

### API
- All REST endpoints are prefixed `/api`
- Swagger UI available at `http://localhost:5000/api-docs`
- Auth is JWT Bearer token; all protected routes use `authMiddleware`

### Server Module Pattern
Each domain in `server/src/modules/<name>/` follows:
```
<name>.routes.js      # Express router + Swagger JSDoc
<name>.controller.js  # req/res handling, calls service
<name>.service.js     # business logic
<name>.repository.js  # raw SQL queries via pg
```
Current modules: `auth`, `agent`, `dashboard`, `llm`, `projects`, `result`, `scan`, `testCase`, `testRun`, `testSheet`

### Client Feature Pattern
`client/src/features/<name>/` contains:
```
api/        # axios calls to server
hooks/      # React Query or custom data hooks
components/ # feature-specific components
```
Pages in `client/src/pages/` compose features. Shared UI lives in `client/src/shared/`.

### Frontend Routing (React Router v7)
- Auth routes: `/login`, `/signup`, `/forgot-password`, etc.
- Protected routes under `/projects/:projectId/` — overview, test-cases, test-runs, collections (test sheets), settings
- Route constants defined in `client/src/config/routes.js`

### Test Sheets vs Test Runs
- **Test Case**: a single automated browser test with a goal/prompt
- **Test Run** (`/api/test-runs`): a single test case execution; agent runs it and POSTs results back
- **Test Sheet** (`/api/test-sheets`): a collection of test cases (like a test suite)
- **Test Sheet Run** (`/api/test-sheet-runs`): execution of an entire test sheet

### LLM Integration
Gemini AI is used for test generation/analysis via `server/src/modules/llm/` and `server/src/config/gemini.js`. The agent worker also uses Gemini for goal-based autonomous browser navigation.

## Skill Usage Guide

Apply the appropriate skill automatically based on the task:

- **`frontend-design`** — React components, pages, JSX, Tailwind styling in `client/src/`
- **`backend-parttens`** — Express routes/middleware/services in `server/src/`; follow the routes → controller → service → repository chain
- **`api-design`** — REST endpoint design, pagination, error formats, Swagger JSDoc
- **`python-patterns`** — Python agent in `agent-worker/app/` (FastAPI, Selenium, async)
- **`claude-api`** — Anthropic SDK or Agent SDK integration

For full-stack features: combine `api-design`/`backend-parttens` (server) + `frontend-design` (client).
