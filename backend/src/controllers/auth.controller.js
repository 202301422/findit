import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { sendOTP, sendPasswordResetOTP } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { firebaseAuth } from "../config/firebaseAdmin.js";

const emailRegex = /^[0-9]{9}@dau\.ac\.in$/;

const verificationGracePeriodHours = Number(process.env.VERIFICATION_GRACE_PERIOD_HOURS ?? 24);
const verificationGracePeriodMs = Number.isFinite(verificationGracePeriodHours) && verificationGracePeriodHours > 0
  ? verificationGracePeriodHours * 60 * 60 * 1000
  : 24 * 60 * 60 * 1000;

const passwordResetOtpExpiryMinutes = Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES ?? 15);
const passwordResetOtpExpiryMs = Number.isFinite(passwordResetOtpExpiryMinutes) && passwordResetOtpExpiryMinutes > 0
  ? passwordResetOtpExpiryMinutes * 60 * 1000
  : 15 * 60 * 1000;

const passwordPolicyChecks = [
  { test: (value) => value.length >= 8, message: "Password must be at least 8 characters long" },
  { test: (value) => /[A-Z]/.test(value), message: "Password must include at least one uppercase letter" },
  { test: (value) => /[a-z]/.test(value), message: "Password must include at least one lowercase letter" },
  { test: (value) => /[0-9]/.test(value), message: "Password must include at least one number" },
  { test: (value) => /[^A-Za-z0-9]/.test(value), message: "Password must include at least one special character" }
];

const validatePasswordPolicy = (password) => {
  const failedRule = passwordPolicyChecks.find((rule) => !rule.test(password));

  if (failedRule) {
    throw new ApiError(400, failedRule.message);
  }
};

export const signup = asyncHandler(async (req, res) => {

  const { name, email, phone, password } = req.body;

  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Email must be dau student email");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(400, "User already exists");
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
    authProvider: "local",
    otpExpiry: Date.now() + 5 * 60 * 1000,
    verificationExpiresAt: Date.now() + verificationGracePeriodMs
  });

  try {
    await sendOTP(email, otp);
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw new ApiError(500, "Failed to send OTP");
  }

  res.json(new ApiResponse(200, null, "OTP sent to email"));
});

export const verifyOTP = asyncHandler(async (req, res) => {

  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) throw new ApiError(404, "User not found");

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiry = null;
  user.verificationExpiresAt = null;

  await user.save();

  res.json(new ApiResponse(200, null, "Account verified"));
});

export const resendOTP = asyncHandler(async (req, res) => {

  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) throw new ApiError(404, "User not found");

  const otp = otpGenerator.generate(6, {
    digits: true,
    alphabets: false
  });

  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;

  await user.save();

  await sendOTP(email, otp);

  res.json(new ApiResponse(200, null, "OTP resent"));
});

export const login = asyncHandler(async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) throw new ApiError(400, "User does not exist");

  if (!user.password) {
    throw new ApiError(400, `Please login using ${user.authProvider}`);
  }

  if (!user.isVerified) {
    throw new ApiError(400, "Verify email first");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new ApiError(400, "Invalid credentials");
  }

  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  user.refreshToken = refreshToken;
  await user.save();

  return res.json(
    new ApiResponse(200, {
      accessToken,
      refreshToken,
      user
    }, "Login successful")
  );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("_id name email phone isVerified authProvider");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.json(
    new ApiResponse(200, { user }, "Current user fetched")
  );
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new ApiError(400, "Firebase ID token is required");
  }

  const decodedToken = await firebaseAuth.verifyIdToken(idToken);
  const { email, name } = decodedToken;

  const googleEmailRegex = /^[^@]+@dau\.ac\.in$/;

  if (!googleEmailRegex.test(email)) {
    throw new ApiError(400, "Only DAU email addresses are allowed");
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      phone: "",
      authProvider: "google",
      isVerified: true
    });
  } else if (!user.isVerified) {
    user.isVerified = true;
    if (!user.name && name) {
      user.name = name;
    }

    await user.save();
  } 
  
  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  user.refreshToken = refreshToken;
  await user.save();

  return res.json(
    new ApiResponse(200,
      {
        accessToken,
        refreshToken,
        user
      },
      "Login successful"
    )
  );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {

  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(403, "Invalid refresh token");
  }

  const newAccessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  res.json(new ApiResponse(200, { accessToken: newAccessToken }, "Token refreshed"));
});

export const forgotPassword = asyncHandler(async (req, res) => {

  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.isVerified) {
    return res.json(new ApiResponse(200, null, "If the email exists, a password reset OTP has been sent"));
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
    throw new ApiError(500, "Failed to send password reset OTP");
  }

  res.json(new ApiResponse(200, null, "If the email exists, a password reset OTP has been sent"));
});

export const resetPassword = asyncHandler(async (req, res) => {

  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });

  if (!user) throw new ApiError(404, "User not found");

  if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
    throw new ApiError(400, "Reset OTP not requested");
  }

  if (user.resetPasswordOtp !== otp || user.resetPasswordOtpExpiry < Date.now()) {
    throw new ApiError(400, "Invalid or expired reset OTP");
  }

  validatePasswordPolicy(newPassword);

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  user.resetPasswordOtp = null;
  user.resetPasswordOtpExpiry = null;

  await user.save();

  res.json(new ApiResponse(200, null, "Password reset successful"));
});

export const logout = asyncHandler(async (req, res) => {

  const user = await User.findById(req.user.id);

  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.json(new ApiResponse(200, null, "Logged out successfully"));
});