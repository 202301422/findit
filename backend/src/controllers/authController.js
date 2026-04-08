import User from "../models/User.js";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { sendOTP, sendPasswordResetOTP } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

const emailRegex = /^[0-9]{9}@dau\.ac\.in$/;
const verificationGracePeriodHours = Number(process.env.VERIFICATION_GRACE_PERIOD_HOURS ?? 24);
const verificationGracePeriodMs = Number.isFinite(verificationGracePeriodHours) && verificationGracePeriodHours > 0
  ? verificationGracePeriodHours * 60 * 60 * 1000
  : 24 * 60 * 60 * 1000;
const passwordResetOtpExpiryMinutes = Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES ?? 15);
const passwordResetOtpExpiryMs = Number.isFinite(passwordResetOtpExpiryMinutes) && passwordResetOtpExpiryMinutes > 0
  ? passwordResetOtpExpiryMinutes * 60 * 1000
  : 15 * 60 * 1000;

export const signup = async (req, res) => {

  try {

    const { name, email, phone, password } = req.body;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Email must be dau student email"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      specialChars: false
    });

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,
      verificationExpiresAt: Date.now() + verificationGracePeriodMs
    });

    try {
      await sendOTP(email, otp);
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }

    res.json({
      message: "OTP sent to email"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to send OTP"
    });
  }
};


export const verifyOTP = async (req, res) => {

  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiry = null;
  user.verificationExpiresAt = null;

  await user.save();

  res.json({
    message: "Account verified"
  });

};


export const resendOTP = async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false
    });

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    await sendOTP(email, otp);

    res.json({
      message: "OTP resent"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to resend OTP"
    });
  }

};


export const login = async (req, res) => {

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "User does not exist"
    });
  }

  if (!user.isVerified) {
    return res.status(400).json({
      message: "Verify email first"
    });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(400).json({
      message: "Invalid credentials"
    });
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user
  });

};


export const forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      return res.json({
        message: "If the email exists, a password reset OTP has been sent"
      });
    }

    const resetPasswordOtp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      specialChars: false
    });

    user.resetPasswordOtp = resetPasswordOtp;
    user.resetPasswordOtpExpiry = Date.now() + passwordResetOtpExpiryMs;

    await user.save();

    try {
      await sendPasswordResetOTP(email, resetPasswordOtp);
    } catch (error) {
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpiry = null;
      await user.save();
      throw error;
    }

    res.json({
      message: "If the email exists, a password reset OTP has been sent"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to send password reset OTP"
    });
  }

};


export const resetPassword = async (req, res) => {

  try {

    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
      return res.status(400).json({ message: "Reset OTP not requested" });
    }

    if (user.resetPasswordOtp !== otp || user.resetPasswordOtpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiry = null;

    await user.save();

    res.json({
      message: "Password reset successful"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to reset password"
    });
  }

};