// backend/routes/auth.js - OTP-only email verification (NO verification links)
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const JobSeeker = require('../models/JobSeeker');
const { protect } = require('../middleware/auth');
const { sendEmailOtp } = require('../utils/email');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

const generateOtp6 = () => {
  // 000000 - 999999 (string)
  return String(Math.floor(100000 + Math.random() * 900000));
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['jobseeker', 'employer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Create user (emailVerified false; OTP is requested from Profile when needed)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'jobseeker',
      emailVerified: false,
      profileCompleted: false
    });

    // If jobseeker, create profile
    if (user.role === 'jobseeker') {
      await JobSeeker.create({
        userId: user._id,
        fullName: `${firstName} ${lastName}`
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profileCompleted: user.profileCompleted,
        privacyAcceptedAt: user.privacyAcceptedAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profileCompleted: user.profileCompleted,
        privacyAcceptedAt: user.privacyAcceptedAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      emailVerified: req.user.emailVerified,
      profileCompleted: req.user.profileCompleted,
      privacyAcceptedAt: req.user.privacyAcceptedAt
    };

    // If jobseeker, get profile
    if (req.user.role === 'jobseeker') {
      const profile = await JobSeeker.findOne({ userId: req.user._id });
      if (profile) {
        user.profile = profile;
      }
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Send 6-digit OTP to user's email (OTP-only verification)
// @access  Private
router.post('/send-otp', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    const now = new Date();

    // Rate limit: max 3 OTP sends per hour
    const windowStart = user.emailOtpSendWindowStart || new Date(0);
    const sameWindow = (now - windowStart) < 60 * 60 * 1000;
    if (!sameWindow) {
      user.emailOtpSendWindowStart = now;
      user.emailOtpSendCount = 0;
    }
    if ((user.emailOtpSendCount || 0) >= 3) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Please try again later.' });
    }

    // Cooldown: 60 seconds between sends
    if (user.emailOtpLastSentAt && (now - user.emailOtpLastSentAt) < 60 * 1000) {
      return res.status(429).json({ success: false, message: 'Please wait a bit before requesting another code.' });
    }

    const otp = generateOtp6();
    user.emailOtpHash = sha256(otp);
    user.emailOtpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = now;
    user.emailOtpSendCount = (user.emailOtpSendCount || 0) + 1;
    await user.save();

    await sendEmailOtp(user.email, user.fullName, otp);

    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP code and mark email verified
// @access  Private
router.post('/verify-otp', protect, [
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('6-digit code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    const now = new Date();
    if (!user.emailOtpHash || !user.emailOtpExpiresAt || user.emailOtpExpiresAt <= now) {
      return res.status(400).json({ success: false, message: 'Code is invalid or expired. Please request a new code.' });
    }

    user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
    if (user.emailOtpAttempts > 5) {
      // invalidate OTP after too many attempts
      user.emailOtpHash = undefined;
      user.emailOtpExpiresAt = undefined;
      await user.save();
      return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new code.' });
    }

    const providedHash = sha256(req.body.code);
    if (providedHash !== user.emailOtpHash) {
      await user.save();
      return res.status(400).json({ success: false, message: 'Incorrect code' });
    }

    // success
    user.emailVerified = true;
    user.emailOtpHash = undefined;
    user.emailOtpExpiresAt = undefined;
    user.emailOtpAttempts = 0;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify code' });
  }
});

module.exports = router;
