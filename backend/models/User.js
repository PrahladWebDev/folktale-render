import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }, // New field for admin role
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
});

export default mongoose.model('User', userSchema);
