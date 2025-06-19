import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Nodemailer setup with SMTP
const transporter = nodemailer.createTransport({
  host: 'mail.webdevprahlad.site',
  port: 465,
  secure: true, // SSL for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Check if transporter is ready
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Transporter Error:', error);
  } else {
    console.log('✅ SMTP Transporter is ready to send emails');
  }
});

// Debug log environment vars (only during development)
console.log('📧 Email Config:', {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS ? '******' : 'NOT SET',
});

// ================== ROUTES ==================

// Register
router.post('/register', async (req, res) => {
  const { username, email, password, isAdmin } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    user = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false,
      isVerified: false,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    await user.save();

    const mailOptions = {
      from: `"Legend Sansar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Verification',
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('❌ Email Send Error:', err);
        return res.status(500).json({ message: 'Failed to send OTP email', error: err.message });
      } else {
        console.log('✅ Email sent:', info.response);
        return res.status(201).json({ message: 'OTP sent to email' });
      }
    });
  } catch (error) {
    console.error('❌ Register Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, message: 'Email verified successfully' });
  } catch (error) {
    console.error('❌ OTP Verification Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.isVerified)
      return res.status(400).json({ message: 'Invalid credentials or email not verified' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email isAdmin');
    res.json(user);
  } catch (error) {
    console.error('❌ Profile Fetch Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
