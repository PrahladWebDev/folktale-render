import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

// Razorpay configuration
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'mail.webdevprahlad.site',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Transporter Error:', error);
  } else {
    console.log('✅ SMTP Transporter is ready to send emails');
  }
});

// Debug (only for development)
console.log('📧 Email Config:', {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS ? '******' : 'NOT SET',
});

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/(jpeg|jpg|png)/.test(file.mimetype);
    console.log('File validation:', {
      name: file.originalname,
      mimetype: file.mimetype,
      extname: path.extname(file.originalname).toLowerCase(),
      valid: extname && mimetype,
    });
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG images are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single('profileImage');

// Input validation middleware
const validateRegister = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail({
      gmail_remove_dots: false,
      all_lowercase: true,
      gmail_remove_subaddress: false,
    }).withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const validateLogin = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail({
      gmail_remove_dots: false,
      all_lowercase: true,
      gmail_remove_subaddress: false,
    }).withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
];

const validateForgotPassword = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail({
      gmail_remove_dots: false,
      all_lowercase: true,
      gmail_remove_subaddress: false,
    }).withMessage('Invalid email format'),
];

const validateResetPassword = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail({
      gmail_remove_dots: false,
      all_lowercase: true,
      gmail_remove_subaddress: false,
    }).withMessage('Invalid email format'),
  body('otp').trim().isNumeric().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('New password must contain at least one number'),
];

const validateUpdateProfile = [
  body('username').optional().trim().notEmpty().withMessage('Username cannot be empty'),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('New password must contain at least one number'),
];

// Error handling middleware for validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file?.path) {
      fs.unlink(req.file.path).catch(() => {});
    }
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Register Route
router.post('/register', upload, validateRegister, validate, async (req, res) => {
  try {
    const { username, email, password, isAdmin } = req.body;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration is missing');
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: 'User already exists',
        errors: [{ field: 'email', message: 'Email is already registered' }],
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    let profileImageUrl = null;

    if (req.file) {
      try {
        const imageResult = await cloudinary.uploader.upload(req.file.path, {
          folder: 'user_profiles',
        });
        console.log('Profile image uploaded:', imageResult.secure_url);
        profileImageUrl = imageResult.secure_url;
      } catch (cloudinaryError) {
        throw new Error(`Failed to upload profile image: ${cloudinaryError.message}`);
      } finally {
        if (req.file?.path) {
          await fs.unlink(req.file.path).catch(err => console.error('Failed to delete temp file:', err));
        }
      }
    }

    user = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false,
      isVerified: false,
      verificationToken,
      profileImageUrl,
    });

    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    const mailOptions = {
      from: `"Legend Sansar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #333;">👋 Welcome to Legend Sansar!</h2>
          <p style="font-size: 16px; color: #555;">
            Thank you for registering. Please click the button below to verify your email address.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2c3e50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p style="font-size: 14px; color: #888;">
            If the button doesn't work, copy and paste this link into your browser: <br>
            <a href="${verificationUrl}" style="color: #2c3e50;">${verificationUrl}</a>
          </p>
          <p style="font-size: 14px; color: #888;">
            If you didn’t request this, you can ignore this email.
          </p>
          <hr style="margin-top: 40px;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">
            © ${new Date().getFullYear()} Legend Sansar. All rights reserved.
          </p>
        </div>
      `,
    };

    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          reject(new Error(`Failed to send verification email: ${err.message}`));
        } else {
          console.log('✅ Email sent:', info.response);
          resolve();
        }
      });
    });

    res.status(201).json({ message: 'Registration successful, verification link sent to email' });
  } catch (error) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(err => console.error('Failed to delete temp file:', err));
    }
    console.error('❌ Register Error:', error);
    res.status(500).json({
      message: 'Registration failed',
      errors: [{ field: 'server', message: error.message }],
    });
  }
});

// Verify Email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired verification token',
        errors: [{ field: 'token', message: 'Invalid or expired verification token' }],
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: jwtToken, message: 'Email verified successfully' });
  } catch (error) {
    console.error('❌ Email Verification Error:', error);
    res.status(500).json({
      message: 'Email verification failed',
      errors: [{ field: 'server', message: error.message }],
    });
  }
});

// Resend Verification Email
router.post('/resend-verification', validateForgotPassword, validate, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        errors: [{ field: 'email', message: 'No user found with this email' }],
      });
    }
    if (user.isVerified) {
      return res.status(400).json({
        message: 'Email already verified',
        errors: [{ field: 'email', message: 'This email is already verified' }],
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    const mailOptions = {
      from: `"Legend Sansar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #333;">👋 Welcome to Legend Sansar!</h2>
          <p style="font-size: 16px; color: #555;">
            Please click the button below to verify your email address.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2c3e50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p style="font-size: 14px; color: #888;">
            If the button doesn't work, copy and paste this link into your browser: <br>
            <a href="${verificationUrl}" style="color: #2c3e50;">${verificationUrl}</a>
          </p>
          <p style="font-size: 14px; color: #888;">
            If you didn’t request this, you can ignore this email.
          </p>
          <hr style="margin-top: 40px;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">
            © ${new Date().getFullYear()} Legend Sansar. All rights reserved.
          </p>
        </div>
      `,
    };

    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          reject(new Error(`Failed to send verification email: ${err.message}`));
        } else {
          console.log('✅ Email sent:', info.response);
          resolve();
        }
      });
    });

    res.status(200).json({ message: 'Verification link sent to email' });
  } catch (error) {
    console.error('❌ Resend Verification Error:', error);
    res.status(500).json({
      message: 'Failed to resend verification email',
      errors: [{ field: 'server', message: error.message }],
    });
  }
});

// Forgot Password
router.post('/forgot-password', validateForgotPassword, validate, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        errors: [{ field: 'email', message: 'No user found with this email' }],
      });
    }
    if (!user.isVerified) {
      return res.status(400).json({
        message: 'Email not verified',
        errors: [{ field: 'email', message: 'This email is not verified' }],
      });
    }

    const otp = generateOTP();
    user.otp = otp.toString();
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    console.log('Generated OTP:', otp);

    await new Promise((resolve, reject) => {
      const mailOptions = {
        from: `"Legend Sansar" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
            <h2 style="color: #333;">🔒 Password Reset Request</h2>
            <p style="font-size: 16px; color: #555;">
              You requested a password reset. Please use the OTP below to reset your password. This OTP is valid for <strong>10 minutes</strong>.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 30px; font-weight: bold; color: #2c3e50; letter-spacing: 5px;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #888;">
              If you didn’t request this, you can ignore this email.
            </p>
            <hr style="margin-top: 40px;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">
              © ${new Date().getFullYear()} Legend Sansar. All rights reserved.
            </p>
          </div>
        `,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          reject(new Error(`Failed to send OTP email: ${err.message}`));
        } else {
          console.log('✅ Email sent:', info.response);
          resolve();
        }
      });
    });

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('❌ Forgot Password Error:', error);
    res.status(500).json({
      message: 'Password reset request failed',
      errors: [{ field: 'server', message: error.message }],
    });
  }
});

// Reset Password
router.post('/reset-password', validateResetPassword, validate, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        errors: [{ field: 'email', message: 'No user found with this email' }],
      });
    }

    console.log('Stored OTP:', user.otp, 'Received OTP:', otp);

    if (user.otp !== otp.toString().trim()) {
      return res.status(400).json({
        message: 'Invalid OTP',
        errors: [{ field: 'otp', message: 'The OTP entered is incorrect' }],
      });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        message: 'Expired OTP',
        errors: [{ field: 'otp', message: 'The OTP has expired' }],
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('❌ Reset Password Error:', error);
    res.status(500).json({
      message: 'Password reset failed',
      errors: [{ field: 'server', message: error.message }],
    });
  }
});

// Update Profile
router.put('/update-profile', auth, upload, validateUpdateProfile, validate, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(err => console.error('Failed to delete temp file:', err));
      }
      return res.status(404).json({
        message: 'User not found',
        errors: [{ field: 'user', message: 'Authenticated user not found' }],
      });
    }

    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        if (req.file?.path) {
          await fs.unlink(req.file.path).catch(err => console.error('Failed to delete temp file:', err));
        }
        return res.status(400).json({
          message: 'Username already taken',
          errors: [{ field: 'username', message: 'This username is already in use' }],
        });
      }
      user.username = username;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      try {
        const imageResult = await cloudinary.uploader.upload(req.file.path, {
          folder: 'user_profiles',
        });
        console.log('Profile image uploaded:', imageResult.secure_url);
        user.profileImageUrl = imageResult.secure_url;
      } catch (cloudinaryError) {
        if (req.file?.path) {
          await fs.unlink(req.file.path).catch(err => console.error('Failed to delete temp file:', err));
        }
        return res.status(500).json({
          message: 'Failed to upload profile image',
          errors: [{ field: 'profileImage', message: `Image upload failed: ${cloudinaryError.message}` }],
        });
      } finally {
        if (req.file?.path) {
          await fs.unlink(req.file.path).catch(err => console.error('Failed to delete temp file:', err));
        }
      }
    }

    await user.save();
    res.json({
      message: 'Profile updated successfully',
      user: {
        username: user.username,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        isAdmin: user.isAdmin,
        isSubscribed: user.isSubscribed,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpires: user.subscriptionExpires,
      },
    });
  } catch (error) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(err => console.error('Failed to delete temp file:', err));
    }
    console.error('❌ Update Profile Error:', error);
    res.status(500).json({
      message: 'Profile update failed',
      errors: [{ field: 'server', message: error.message }],
    });
  }
});

// Login
router.post('/login', validateLogin, validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        errors: [{ field: 'email', message: 'No user found with this email' }],
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Email not verified',
        errors: [{ field: 'email', message: 'Please verify your email before logging in' }],
        resendVerification: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
        errors: [{ field: 'password', message: 'Incorrect password' }],
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
        isSubscribed: user.isSubscribed,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpires: user.subscriptionExpires,
      },
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({
      message: 'Login failed',
      errors: [{ field: 'server', message: error.message }],
    });
  }
});

// Get Profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email isAdmin profileImageUrl isSubscribed subscriptionPlan subscriptionExpires');
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        errors: [{ field: 'user', message: 'Authenticated user not found' }],
      });
    }
    // Check if subscription has expired
    if (user.isSubscribed && user.subscriptionExpires < Date.now()) {
      user.isSubscribed = false;
      user.subscriptionPlan = null;
      user.subscriptionExpires = null;
      await user.save();
    }
    res.json({
      message: 'Profile retrieved successfully',
      user,
    });
  } catch (error) {
    console.error('❌ Profile Fetch Error:', error);
    res.status(500).json({
      message: 'Failed to fetch profile',
      errors: [{ field: 'server', message: error.message }],
    });
  }
});

// Create Subscription Order
router.post('/create-subscription-order', auth, async (req, res) => {
  try {
    console.log('Creating subscription order for plan:', req.body.plan, 'User:', req.user.email);
    const { plan } = req.body;
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        message: 'Invalid plan selected',
        errors: [{ field: 'plan', message: 'Plan must be either monthly or yearly' }],
      });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        errors: [{ field: 'user', message: 'Authenticated user not found' }],
      });
    }
    if (user.isSubscribed && user.subscriptionExpires > Date.now()) {
      return res.status(400).json({
        message: 'Active subscription already exists',
        errors: [{ field: 'subscription', message: 'You already have an active subscription' }],
      });
    }
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay keys missing:', { keyId: razorpayKeyId, keySecret: razorpayKeySecret ? '******' : 'NOT SET' });
      return res.status(500).json({
        message: 'Server configuration error',
        errors: [{ field: 'server', message: 'Razorpay credentials are not configured' }],
      });
    }
    const amount = plan === 'monthly' ? 10000 : 100000;
    const receipt = `receipt_${user._id}_${Date.now()}`;
    console.log('Sending Razorpay request:', {
      amount,
      currency: 'INR',
      receipt,
      keyId: razorpayKeyId,
    });
    const response = await axios.post(
      'https://api.razorpay.com/v1/orders',
      {
        amount,
        currency: 'INR',
        receipt,
      },
      {
        auth: {
          username: razorpayKeyId,
          password: razorpayKeySecret,
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );
    console.log('Razorpay order created:', response.data);
    res.json({
      orderId: response.data.id,
      amount: response.data.amount,
      currency: response.data.currency,
      plan,
    });
  } catch (error) {
    console.error('❌ Create Subscription Order Error:', {
      message: error.message,
      stack: error.stack,
      status: error.response?.status,
      razorpayError: error.response?.data?.error || 'No error details provided',
    });
    const errorMessage = error.response?.data?.error?.description || error.message;
    const errorCode = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
    res.status(error.response?.status || 500).json({
      message: 'Failed to create subscription order',
      errors: [{ field: 'server', message: errorMessage, code: errorCode }],
    });
  }
});

// Verify Subscription Payment
router.post('/verify-subscription', auth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        errors: [{ field: 'user', message: 'Authenticated user not found' }],
      });
    }

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: 'Invalid payment signature',
        errors: [{ field: 'signature', message: 'Payment verification failed' }],
      });
    }

    // Save subscription transaction
    const Subscription = mongoose.model('Subscription');
    const subscription = new Subscription({
      userId: user._id,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      plan,
      amount: plan === 'monthly' ? 10000 : 100000,
      status: 'completed',
    });
    await subscription.save();

    // Update user subscription status
    user.isSubscribed = true;
    user.subscriptionPlan = plan;
    user.subscriptionExpires = plan === 'monthly'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    await user.save();

    // Send confirmation email
    const mailOptions = {
      from: `"Legend Sansar" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Subscription Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #333;">🎉 Subscription Confirmed!</h2>
          <p style="font-size: 16px; color: #555;">
            Thank you for subscribing to Legend Sansar’s ${plan} plan! You now have access to exclusive podcasts.
          </p>
          <p style="font-size: 16px; color: #555;">
            <strong>Plan:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)}<br>
            <strong>Amount Paid:</strong> ₹${plan === 'monthly' ? '100' : '1000'}<br>
            <strong>Expires On:</strong> ${user.subscriptionExpires.toLocaleDateString()}
          </p>
          <p style="font-size: 14px; color: #888;">
            Enjoy your subscription and dive into the world of legends!
          </p>
          <hr style="margin-top: 40px;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">
            © ${new Date().getFullYear()} Legend Sansar. All rights reserved.
          </p>
        </div>
      `,
    };

    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Failed to send subscription confirmation email:', err);
        } else {
          console.log('✅ Subscription confirmation email sent:', info.response);
        }
        resolve();
      });
    });

    res.json({
      message: 'Subscription activated successfully',
      user: {
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
        isSubscribed: user.isSubscribed,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpires: user.subscriptionExpires,
      },
    });
  } catch (error) {
    console.error('❌ Verify Subscription Error:', error);
    res.status(500).json({
      message: 'Failed to verify subscription',
      errors: [{ field: 'server', message: error.message }],
    });
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('Generated OTP (function):', otp);
  return otp;
};

export default router;
