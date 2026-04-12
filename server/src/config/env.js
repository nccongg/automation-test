"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
};

const env = {
  // Server
  PORT: toInt(process.env.PORT, 5000),
  NODE_ENV: process.env.NODE_ENV || "development",
  BODY_LIMIT: process.env.BODY_LIMIT || "10mb",

  // Database
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: toInt(process.env.DB_PORT, 5432),
  DB_NAME: process.env.DB_NAME || "automation_test",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",

  // Gemini AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",

  // Selenium
  SELENIUM_BROWSER: process.env.SELENIUM_BROWSER || "chrome",
  SELENIUM_HEADLESS: toBool(process.env.SELENIUM_HEADLESS, true),
  SCREENSHOTS_DIR: process.env.SCREENSHOTS_DIR || "./screenshots",

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || "secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Agent Worker
  AGENT_WORKER_BASE_URL:
    process.env.AGENT_WORKER_BASE_URL ||
    process.env.AGENT_WORKER_URL ||
    "http://localhost:8001",

  AGENT_CALLBACK_SECRET: process.env.AGENT_CALLBACK_SECRET || "",
};

module.exports = env;
