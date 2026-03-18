'use strict';

const authService = require('./auth.service');

async function register(req, res, next) {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body);
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const data = await authService.forgotPassword(req.body);
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const data = await authService.verifyOtp(req.body);
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const data = await authService.resetPassword(req.body);
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
