'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Middleware to verify JWT token.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token.',
    });
  }
}

module.exports = authMiddleware;
