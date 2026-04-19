import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  phone: {
    type: String,
    required: true
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  otp: String,

  otpExpiry: Date,

  resetPasswordOtp: String,

  resetPasswordOtpExpiry: Date,

  verificationExpiresAt: Date,

  accessToken: {
    type: String
  },

  refreshToken: {
    type: String
  }

}, { timestamps: true });

userSchema.index({ verificationExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("User", userSchema);