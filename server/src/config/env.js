'use strict';

require('dotenv').config();

const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_NAME: process.env.DB_NAME || 'automation_test',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',

  // Gemini AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Selenium
  SELENIUM_BROWSER: process.env.SELENIUM_BROWSER || 'chrome',
  SELENIUM_HEADLESS: process.env.SELENIUM_HEADLESS === 'true',
  SCREENSHOTS_DIR: process.env.SCREENSHOTS_DIR || './screenshots',
};

module.exports = env;
