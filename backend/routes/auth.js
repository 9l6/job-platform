// backend/routes/auth.js
// CommonJS routes for auth + OTP (Render-safe)

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const { sendOtpEmail } = require('../services/mailtrapApi');

const router = express.Router();

// ---------- Helpers ----------
function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing');
  return jwt.sign({ id: userId }, secret, { expiresIn: process.env.JWT_EXPIRE || '7d' });
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// ---------- Auth ----------

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedEmail = normalizeEmail(email);

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Password hashing handled by User pre-save hook
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      role: role || 'jobseeker',
    });

    const token = signToken(user._id);

    return res.status(201).json({
      message: 'Registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        emailVerified: !!user.emailVerified,
        profileCompleted: !!user.profileCompleted,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user._id);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        emailVerified: !!user.emailVerified,
        profileCompleted: !!user.profileCompleted,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// ---------- OTP (Email verification) ----------

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Simple anti-abuse: max 5 OTP sends per 15 minutes
    const now = new Date();
    const windowMs = 15 * 60 * 1000;
    const maxPerWindow = 5;
    if (!user.emailOtpSendWindowStart || now - user.emailOtpSendWindowStart > windowMs) {
      user.emailOtpSendWindowStart = now;
      user.emailOtpSendCount = 0;
    }
    if ((user.emailOtpSendCount || 0) >= maxPerWindow) {
      return res.status(429).json({ message: 'Too many OTP requests. Try again later.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);

    user.emailOtpHash = otpHash;
    user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = now;
    user.emailOtpSendCount = (user.emailOtpSendCount || 0) + 1;
    await user.save();

    await sendOtpEmail(user.email, otpCode);

    return res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
      return res.status(400).json({ message: 'No OTP found. Request a new one.' });
    }

    if (Date.now() > new Date(user.emailOtpExpiresAt).getTime()) {
      return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    }

    user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
    if (user.emailOtpAttempts > 5) {
      await user.save();
      return res.status(429).json({ message: 'Too many attempts. Request a new OTP.' });
    }

    const ok = await bcrypt.compare(otp, user.emailOtpHash);
    if (!ok) {
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.emailVerified = true;
    user.emailOtpHash = undefined;
    user.emailOtpExpiresAt = undefined;
    user.emailOtpAttempts = 0;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

module.exports = router;
