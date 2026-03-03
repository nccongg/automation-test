'use strict';

const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
});

/**
 * Run a query on the pool.
 * @param {string} text - SQL query string
 * @param {Array} [params] - Query parameters
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === 'development') {
    console.log(`[DB] query executed in ${duration}ms — rows: ${result.rowCount}`);
  }
  return result;
}

/**
 * Test database connection.
 */
async function testConnection() {
  const client = await pool.connect();
  const { rows } = await client.query('SELECT NOW() AS now');
  client.release();
  return rows[0].now;
}

module.exports = { pool, query, testConnection };
