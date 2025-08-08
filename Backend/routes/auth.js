const express = require('express');
const router = express.Router();
const User = require('../models/User');
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Input sanitization helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

// Validation middleware
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('phone')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const validateLogin = [
  body('usernameOrPhone')
    .trim()
    .notEmpty()
    .withMessage('Username or phone number is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateOTP = [
  body('phone')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits')
];

// New validation middleware for resending OTP
const validatePhone = [
  body('phone')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits')
];

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register - Step 1: Create user and send OTP
router.post('/register', validateRegistration, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { username, phone, email, password, confirmPassword } = req.body;

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPhone = sanitizeInput(phone);
    const sanitizedEmail = sanitizeInput(email);

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username: sanitizedUsername }, { phone: sanitizedPhone }, { email: sanitizedEmail }]
    });

    if (existingUser) {
      if (existingUser.username === sanitizedUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
      if (existingUser.phone === sanitizedPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered'
        });
      }
      if (existingUser.email === sanitizedEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    // Create user (not verified yet)
    const user = new User({
      username: sanitizedUsername,
      phone: sanitizedPhone,
      email: sanitizedEmail,
      password,
      otp,
      otp_expiry: expiry,
      isVerified: false
    });

    await user.save();

    // Send OTP via SMS
    try {
      await client.messages.create({
        body: `Your OTP for Solar Wealth Grow registration is ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${sanitizedPhone}` // if in India
      });

      res.json({
        success: true,
        message: 'Registration successful! Please verify your OTP.',
        userId: user._id
      });
    } catch (smsError) {
      // If SMS fails, delete the user and return error
      await User.findByIdAndDelete(user._id);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Send OTP (for resending) - Use the new validatePhone middleware
router.post('/send-otp', validatePhone, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { phone } = req.body;
    const sanitizedPhone = sanitizeInput(phone);

    const user = await User.findOne({ phone: sanitizedPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    // Update user with new OTP
    user.otp = otp;
    user.otp_expiry = expiry;
    await user.save();

    // Send OTP via SMS
    await client.messages.create({
      body: `Your OTP for Solar Wealth Grow is ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${sanitizedPhone}`
    });

    res.json({
      success: true,
      message: 'OTP sent successfully!'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// Verify OTP and complete registration
router.post('/verify-otp', validateOTP, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { phone, otp } = req.body;
    const sanitizedPhone = sanitizeInput(phone);
    const sanitizedOTP = sanitizeInput(otp);

    const user = await User.findOne({ phone: sanitizedPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.otp !== sanitizedOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (user.otp_expiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = null;
    user.otp_expiry = null;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'OTP verified successfully! Registration completed.',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { usernameOrPhone, password } = req.body;
    const sanitizedUsernameOrPhone = sanitizeInput(usernameOrPhone);

    // Find user by username or phone
    const user = await User.findOne({
      $or: [
        { username: sanitizedUsernameOrPhone },
        { phone: sanitizedUsernameOrPhone }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your account with OTP first'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error during logout' });
  }
});

module.exports = router;