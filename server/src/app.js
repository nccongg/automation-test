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

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const env = require("./config/env");
const routes = require("./routes");

const app = express();

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

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", routes);

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
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`✅ Server running at http://localhost:${env.PORT}`);
  console.log(`   ENV: ${env.NODE_ENV}`);
  console.log(`   DB:  ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
  console.log(`   Agent Worker: ${env.AGENT_WORKER_BASE_URL}`);
});

module.exports = app;