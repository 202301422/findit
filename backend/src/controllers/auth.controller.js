import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { sendOTP, sendPasswordResetOTP } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { firebaseAuth } from "../config/firebaseAdmin.js";
import {
  validateEmailFormat,
  validateInstitutionalEmail,
  validateOtpFormat,
  validatePasswordPolicy,
  validateRequiredString,
} from "../utils/validators.js";
import { buildAuthSessionPayload } from "../utils/authResponse.js";
import { serializeUser } from "../utils/userSerializer.js";
import crypto from "node:crypto";

const verificationGracePeriodHours = Number(process.env.VERIFICATION_GRACE_PERIOD_HOURS ?? 24);
const verificationGracePeriodMs = Number.isFinite(verificationGracePeriodHours) && verificationGracePeriodHours > 0
  ? verificationGracePeriodHours * 60 * 60 * 1000
  : 24 * 60 * 60 * 1000;

const passwordResetOtpExpiryMinutes = Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES ?? 15);
const passwordResetOtpExpiryMs = Number.isFinite(passwordResetOtpExpiryMinutes) && passwordResetOtpExpiryMinutes > 0
  ? passwordResetOtpExpiryMinutes * 60 * 1000
  : 15 * 60 * 1000;

const refreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.REFRESH_TOKEN_COOKIE_SAMESITE || "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const clearRefreshTokenCookieOptions = () => ({
  ...refreshTokenCookieOptions(),
  maxAge: 0,
});

const generateNumericOtp = () => String(crypto.randomInt(100000, 1000000));

const getCookieValue = (cookieHeader, cookieName) => {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";");

  for (const part of parts) {
    const [name, ...valueParts] = part.trim().split("=");

    if (name === cookieName) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
};

const issueTokens = async (user, res) => {
  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions());

  return accessToken;
};

export const assertCanAuthenticate = (user) => {
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.accountStatus !== "active") {
    throw new ApiError(403, "Account is not active");
  }
};

export const signup = asyncHandler(async (req, res) => {

  const name = validateRequiredString(req.body.name, "Name", { maxLength: 100 });
  const email = validateInstitutionalEmail(req.body.email);
  const phone = validateRequiredString(req.body.phone, "Phone", { maxLength: 20 });
  const password = validateRequiredString(req.body.password, "Password");

  validatePasswordPolicy(password);

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const otp = generateNumericOtp();

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

  const email = validateInstitutionalEmail(req.body.email);
  const otp = validateOtpFormat(req.body.otp);

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

  const email = validateInstitutionalEmail(req.body.email);

  const user = await User.findOne({ email });

  if (!user) throw new ApiError(404, "User not found");

  const otp = generateNumericOtp();

  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;

  await user.save();

  await sendOTP(email, otp);

  res.json(new ApiResponse(200, null, "OTP resent"));
});

export const login = asyncHandler(async (req, res) => {

  const email = validateEmailFormat(req.body.email);
  const password = validateRequiredString(req.body.password, "Password");

  const user = await User.findOne({ email }).select("+password");

  if (!user) throw new ApiError(400, "User does not exist");

  assertCanAuthenticate(user);

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

  const accessToken = await issueTokens(user, res);

  return res.json(
    new ApiResponse(200, {
      ...buildAuthSessionPayload(user, accessToken)
    }, "Login successful")
  );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("_id name email phone username avatar avatarPublicId bio college city state country isVerified authProvider accountStatus createdAt updatedAt");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.json(
    new ApiResponse(200, { user: serializeUser(user) }, "Current user fetched")
  );
});

export const googleLogin = asyncHandler(async (req, res) => {
  const idToken = validateRequiredString(req.body.idToken, "Firebase ID token");

  const decodedToken = await firebaseAuth.verifyIdToken(idToken);
  const { email, name } = decodedToken;

  const normalisedEmail = validateInstitutionalEmail(email);

  let user = await User.findOne({ email: normalisedEmail });

  if (!user) {
    user = await User.create({
      name: name || normalisedEmail.split("@")[0],
      email: normalisedEmail,
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

  assertCanAuthenticate(user);
  
  const accessToken = await issueTokens(user, res);

  return res.json(
    new ApiResponse(200,
      {
        ...buildAuthSessionPayload(user, accessToken)
      },
      "Login successful"
    )
  );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {

  const refreshToken = getCookieValue(req.headers.cookie, "refreshToken");

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    res.clearCookie("refreshToken", clearRefreshTokenCookieOptions());
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(decoded.id).select("_id refreshToken accountStatus");

  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  assertCanAuthenticate(user);

  const newAccessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json(new ApiResponse(200, { accessToken: newAccessToken }, "Token refreshed"));
});

export const forgotPassword = asyncHandler(async (req, res) => {

  const email = validateEmailFormat(req.body.email);

  const user = await User.findOne({ email });

  if (!user || !user.isVerified) {
    return res.json(new ApiResponse(200, null, "If the email exists, a password reset OTP has been sent"));
  }

  const resetPasswordOtp = generateNumericOtp();

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

  const email = validateEmailFormat(req.body.email);
  const otp = validateOtpFormat(req.body.otp, "Reset OTP");
  const newPassword = validateRequiredString(req.body.newPassword, "New password");

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

  const user = req.user?._id ? await User.findById(req.user._id) : null;

  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.clearCookie("refreshToken", clearRefreshTokenCookieOptions());

  res.json(new ApiResponse(200, null, "Logged out successfully"));
});