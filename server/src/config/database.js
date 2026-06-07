'use strict';

const { Pool } = require('pg');
const env = require('./env');

// When DATABASE_URL is set (Neon, Supabase, Railway, etc.) use connection string with SSL.
// Otherwise fall back to individual host/port/user/password params.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ...(env.DB_SSL && { ssl: { rejectUnauthorized: false } }),
    };

const pool = new Pool(poolConfig);

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
