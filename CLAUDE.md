# Automation Test Platform

## Project Overview
Full-stack automation testing platform with three main components:
- **client/** — React frontend (Vite, JSX)
- **server/** — Node.js/Express backend
- **agent-worker/** — Python agent for running test automation

## Tech Stack
- **Frontend**: React, Vite, JSX
- **Backend**: Node.js, Express, Swagger (API docs)
- **Agent Worker**: Python
- **Database**: SQL (see `.sql` files for schema)
- **Infrastructure**: Docker Compose

## Skill Usage Guide

When working on this project, automatically apply the appropriate skill based on the task:

### Use `frontend-design` when:
- Creating or modifying React components in `client/src/`
- Building new pages, layouts, or UI features
- Working with JSX, CSS, or component styling

### Use `backend-parttens` when:
- Working on Express routes, middleware, or services in `server/src/`
- Implementing repository/service/controller patterns
- Adding caching, error handling, or authentication logic
- Optimizing database queries from the server side

### Use `api-design` when:
- Designing or modifying REST API endpoints
- Adding pagination, filtering, or sorting to APIs
- Defining request/response contracts or error formats
- Working on API versioning or rate limiting

### Use `python-patterns` when:
- Working on the Python agent in `agent-worker/app/`
- Writing or refactoring Python automation scripts
- Adding type hints, error handling, or concurrency in Python

### Use `claude-api` when:
- Integrating with Claude/Anthropic APIs
- Using the Anthropic SDK or Agent SDK

### Combining skills:
- For full-stack features (e.g., new API + UI), apply both `api-design`/`backend-parttens` for the server and `frontend-design` for the client
- For agent endpoints, combine `python-patterns` with `api-design`

## Project Structure
```
client/src/
  features/       # Feature modules
  pages/          # Page components
  components/     # Shared components
  api/            # API client functions
  store/          # State management
server/src/
  modules/        # Domain modules (e.g., testRun/)
  middleware/     # Express middleware
  routes.js       # Route definitions
  app.js          # App entry point
agent-worker/app/
  runner.py       # Test runner logic
```
