'use strict';

const { Router } = require('express');
const ctrl = require('./auth.controller');

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 */
router.post('/register', ctrl.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 */
router.post('/login', ctrl.login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset OTP
 */
router.post('/forgot-password', ctrl.forgotPassword);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP for password reset
 */
router.post('/verify-otp', ctrl.verifyOtp);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using a token
 */
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;
