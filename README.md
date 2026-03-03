# Website Automation Testing

A full-stack web-based automation testing platform powered by Selenium WebDriver and Gemini AI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | ReactJS + Vite + shadcn/ui + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL 16 |
| Automation | Selenium WebDriver |
| AI | Google Gemini AI |

## Project Structure

```
automation-test/
├── client/                    # React frontend
├── server/
│   ├── src/
│   │   ├── app.js             # Entry point — Express setup
│   │   ├── routes.js          # API router
│   │   ├── config/
│   │   │   ├── env.js         # Environment variables
│   │   │   ├── database.js    # PostgreSQL pool
│   │   │   └── gemini.js      # Gemini AI config
│   │   ├── modules/
│   │   │   ├── testCase/      # Test case CRUD
│   │   │   ├── testRun/       # Test run execution
│   │   │   └── result/        # Results & reports
│   │   ├── middleware/        # Custom middleware
│   │   └── utils/             # Helper functions
│   ├── migrations/
│   │   └── 001_init.sql       # Database schema
│   └── .env                   # Environment variables (local only)
└── README.md
```

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL 16
- Chrome browser (for Selenium)

### 1. Clone and install dependencies

```bash
# Install frontend deps
cd client && npm install

# Install backend deps
cd ../server && npm install
```

**Backend dependencies** (tự động cài qua `npm install`):

| Package | Mục đích |
|---------|---------|
| `express` | HTTP server |
| `pg` | Kết nối PostgreSQL |
| `dotenv` | Đọc file `.env` |
| `cors` | Cho phép frontend gọi API |
| `helmet` | Bảo mật HTTP headers |
| `morgan` | Log request |
| `uuid` | Generate unique IDs |

### 2. Configure environment variables

**Mac/Linux:**
```bash
cp .env.example .env
```

**Windows:**
```cmd
copy .env.example .env
```

---

### 3. Cài và khởi động PostgreSQL

#### 🍎 macOS (Homebrew)

```bash
# Cài PostgreSQL 16
brew install postgresql@16

# Thêm vào PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc

# Khởi động PostgreSQL
brew services start postgresql@16
```

#### 🪟 Windows

1. Tải installer tại: https://www.postgresql.org/download/windows/
2. Chạy installer, cài version 16, đặt password cho user `postgres`
3. Sau khi cài xong, mở **SQL Shell (psql)** hoặc **pgAdmin** từ Start Menu

---

### 4. Tạo database và chạy migration

#### 🍎 macOS

```bash
# Tạo database
psql postgres -c "CREATE DATABASE automation_test;"

# Chạy migration (từ thư mục gốc project)
psql -d automation_test -f server/migrations/001_init.sql
```

#### 🪟 Windows

Mở **SQL Shell (psql)** hoặc **Command Prompt** (đảm bảo `psql` đã được thêm vào PATH):

```cmd
psql -U postgres -c "CREATE DATABASE automation_test;"
psql -U postgres -d automation_test -f server/migrations/001_init.sql
```

> **Lưu ý Windows:** Nếu `psql` chưa nhận trong CMD, thêm vào PATH:
> `C:\Program Files\PostgreSQL\16\bin`

---

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
