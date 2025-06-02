import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware for registration
const registerValidation = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .trim().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('isAdmin').optional().isBoolean().withMessage('isAdmin must be a boolean'),
];

// Validation middleware for login
const loginValidation = [
  body('username').notEmpty().withMessage('Username is required').trim(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register user
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        error: 'validation_error',
        details: errors.array(),
      });
    }

    const { username, password, isAdmin = false } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
        error: 'user_exists',
      });
    }

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        message: 'Internal server error: Configuration issue',
        error: 'server_config_error',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save user
    const user = new User({
      username,
      password: hashedPassword,
      isAdmin,
    });
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'User registered successfully',
      data: { token, username, isAdmin },
    });
  } catch (error) {
    console.error('Error during registration:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid user data',
        error: 'mongoose_validation_error',
        details: Object.values(error.errors).map(err => err.message),
      });
    }
    res.status(500).json({
      message: 'Internal server error during registration',
      error: 'server_error',
    });
  }
});

// Login user
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        error: 'validation_error',
        details: errors.array(),
      });
    }

    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Invalid username or password',
        error: 'invalid_credentials',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid username or password',
        error: 'invalid_credentials',
      });
    }

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        message: 'Internal server error: Configuration issue',
        error: 'server_config_error',
      });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      data: { token, username: user.username, isAdmin: user.isAdmin },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      message: 'Internal server error during login',
      error: 'server_error',
    });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    // Ensure user is attached by auth middleware
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'auth_required',
      });
    }

    // Fetch user data
    const user = await User.findById(req.user.id).select('username isAdmin');
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'user_not_found',
      });
    }

    res.json({
      message: 'User profile retrieved successfully',
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      message: 'Internal server error while fetching user profile',
      error: 'server_error',
    });
  }
});

export default router;
