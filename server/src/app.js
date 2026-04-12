'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const env = require('./config/env');
const routes = require('./routes');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));
app.use(cors());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use(express.json({ limit: env.BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));

// ─── Static Files ─────────────────────────────────────────────────────────────
const path = require('path');
app.use('/screenshots', express.static(path.join(__dirname, '../screenshots')));

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
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