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

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

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
      valid: extname && mimetype 
    });
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images (jpeg, jpg, png) only'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile images
  },
});

// ================== ROUTES ==================

// Register Route
router.post('/register', upload.single('profileImage'), async (req, res) => {
  const { username, email, password, isAdmin } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    let profileImageUrl = null;

    if (req.file) {
      try {
        const imageResult = await cloudinary.uploader.upload(req.file.path, {
          folder: 'user_profiles',
        });
        console.log('Profile image uploaded:', imageResult.secure_url);
        profileImageUrl = imageResult.secure_url;
        await fs.unlink(req.file.path).catch(() => {});
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
        return res.status(500).json({ message: 'Failed to upload profile image' });
      }
    }

    user = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false,
      isVerified: false,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
      profileImageUrl,
    });

    await user.save();

    const mailOptions = {
      from: `"Legend Sansar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #333;">👋 Welcome to Legend Sansar!</h2>
          <p style="font-size: 16px; color: #555;">
            Thank you for registering. Please use the OTP below to verify your email address. This OTP is valid for <strong>10 minutes</strong>.
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
        console.error('❌ Email Send Error:', err);
        return res.status(500).json({ message: 'Failed to send OTP email', error: err.message });
      } else {
        console.log('✅ Email sent:', info.response);
        return res.status(201).json({ message: 'OTP sent to email' });
      }
    });
  } catch (error) {
    console.error('❌ Register Error:', error);
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, message: 'Email verified successfully' });
  } catch (error) {
    console.error('❌ OTP Verification Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (!user.isVerified) return res.status(400).json({ message: 'Email not verified' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

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
        console.error('❌ Email Send Error:', err);
        return res.status(500).json({ message: 'Failed to send OTP email', error: err.message });
      }
      console.log('✅ Email sent:', info.response);
      return res.status(200).json({ message: 'OTP sent to email' });
    });
  } catch (error) {
    console.error('❌ Forgot Password Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('❌ Reset Password Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Profile
router.put('/update-profile', auth, upload.single('profileImage'), async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'User not found' });
    }

    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ message: 'Username already taken' });
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
        await fs.unlink(req.file.path).catch(() => {});
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
        return res.status(500).json({ message: 'Failed to upload profile image' });
      }
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', username: user.username, profileImageUrl: user.profileImageUrl });
  } catch (error) {
    console.error('❌ Update Profile Error:', error);
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
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

// Get Profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email isAdmin profileImageUrl');
    res.json(user);
  } catch (error) {
    console.error('❌ Profile Fetch Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
