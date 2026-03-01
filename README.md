# Website Automation Testing

A full-stack web-based automation testing platform powered by Selenium WebDriver and Gemini AI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | ReactJS + Vite + shadcn/ui + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (via DBeaver) |
| Automation | Selenium WebDriver |
| AI | Google Gemini AI |

## Project Structure

```
automation-test/
├── client/          # React frontend
├── server/          # Node.js backend
├── docker-compose.yml
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites
- Node.js >= 18
- Docker & Docker Compose
- Chrome browser (for Selenium)

### 1. Clone and install dependencies

```bash
# Install frontend deps
cd client && npm install

# Install backend deps
cd ../server && npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Start PostgreSQL

```bash
docker-compose up -d
```

### 4. Run database migrations

```bash
cd server
psql -U postgres -d automation_test -f migrations/001_init.sql
```

### 5. Start the backend

```bash
cd server
npm run dev
# API running at http://localhost:5000
```

### 6. Start the frontend

```bash
cd client
npm run dev
# App running at http://localhost:5173
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/test-cases` | Manage test cases |
| GET/PUT/DELETE | `/api/test-cases/:id` | Single test case |
| POST | `/api/test-runs` | Execute a test |
| GET | `/api/test-runs/:id` | Get run status |
| GET | `/api/results` | Get test results |
