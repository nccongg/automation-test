"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const env = require("./config/env");
const routes = require("./routes");
const agentRepository = require("./modules/agent/agent.repository");

const app = express();

// Running behind Cloudflare/Render — trust the first proxy hop so rate-limit
// and req.ip use the real client IP instead of the proxy address.
app.set("trust proxy", 1);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

app.use(express.json({ limit: env.BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const rateLimitMessage = {
  status: "error",
  message: "Too many requests. Please slow down and try again later.",
};

// Broad limiter for the whole API surface.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

// Strict limiter for auth: brute-force / OTP / email-flood protection.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

// ─── Static Files / Screenshot Resolver ──────────────────────────────────────
const screenshotsDir = path.join(__dirname, "../screenshots");

function safeSendFile(res, filePath) {
  if (filePath && fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return false;
}

// Resolve screenshot by filename:
// 1) server/screenshots/<fileName>
// 2) OS temp folders: browser_use_agent_*/screenshots/<fileName>
app.get("/screenshots/:fileName", (req, res) => {
  const { fileName } = req.params;

  // Reject path traversal: only allow a bare filename, never a path.
  if (fileName !== path.basename(fileName)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid screenshot filename",
    });
  }

  try {
    // Prefer server local screenshots folder first
    const localPath = path.join(screenshotsDir, fileName);
    if (safeSendFile(res, localPath)) return;

    // Fallback to temp folders created by browser-use agent
    const tempRoot = os.tmpdir();
    const entries = fs.readdirSync(tempRoot, { withFileTypes: true });

    const matchedPaths = entries
      .filter(
        (entry) =>
          entry.isDirectory() &&
          entry.name.startsWith("browser_use_agent_"),
      )
      .map((entry) =>
        path.join(tempRoot, entry.name, "screenshots", fileName),
      )
      .filter((candidatePath) => fs.existsSync(candidatePath));

    if (matchedPaths.length > 0) {
      // If multiple runs contain same file name, serve the newest one
      matchedPaths.sort((a, b) => {
        const aTime = fs.statSync(a).mtimeMs;
        const bTime = fs.statSync(b).mtimeMs;
        return bTime - aTime;
      });

      return res.sendFile(matchedPaths[0]);
    }

    return res.status(404).json({
      status: "error",
      message: `Screenshot ${fileName} not found`,
    });
  } catch (err) {
    console.error("[screenshots] resolver failed:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to resolve screenshot",
    });
  }
});

// Keep static mapping too, useful if screenshots are copied into server/screenshots
app.use("/screenshots", express.static(screenshotsDir));

// Screenshots stored as bytea in the database (Neon) — survives across
// services/containers that don't share a filesystem.
app.get("/screenshots/db/:evidenceId", async (req, res) => {
  try {
    const evidenceId = Number(req.params.evidenceId);
    if (!Number.isInteger(evidenceId) || evidenceId <= 0) {
      return res.status(400).json({ status: "error", message: "Invalid evidence id" });
    }

    const evidence = await agentRepository.getEvidenceImage(evidenceId);
    if (!evidence || !evidence.file_data) {
      return res.status(404).json({ status: "error", message: "Screenshot not found" });
    }

    res.set("Content-Type", evidence.mime_type || "image/png");
    return res.send(evidence.file_data);
  } catch (err) {
    console.error("[screenshots] db lookup failed:", err);
    return res.status(500).json({ status: "error", message: "Failed to load screenshot" });
  }
});

// ─── Swagger UI ───────────────────────────────────────────────────────────────
// Only expose the API documentation outside of production to avoid leaking the
// full endpoint map to the public.
if (env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter, routes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[Error]", err);
  const status = err.status || 500;
  // Surface intentional client-error messages (4xx), but never leak internal
  // error details on 5xx responses.
  const message =
    status >= 500 ? "Internal server error" : err.message || "Request failed";
  res.status(status).json({
    status: "error",
    message,
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`✅ Server running on port ${env.PORT}`);
  console.log(`   ENV: ${env.NODE_ENV}`);
  const dbLabel = env.DATABASE_URL
    ? `DATABASE_URL (Neon/cloud)`
    : `${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
  console.log(`   DB:  ${dbLabel}`);
  console.log(`   Agent Worker: ${env.AGENT_WORKER_BASE_URL}`);
});

module.exports = app;