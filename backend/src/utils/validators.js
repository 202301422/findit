import ApiError from "./ApiError.js";
import mongoose from "mongoose";

const passwordPolicyChecks = [
  { test: (value) => value.length >= 8, message: "Password must be at least 8 characters long" },
  { test: (value) => /[A-Z]/.test(value), message: "Password must include at least one uppercase letter" },
  { test: (value) => /[a-z]/.test(value), message: "Password must include at least one lowercase letter" },
  { test: (value) => /[0-9]/.test(value), message: "Password must include at least one number" },
  { test: (value) => /[^A-Za-z0-9]/.test(value), message: "Password must include at least one special character" }
];

export const validatePasswordPolicy = (password) => {
  const failedRule = passwordPolicyChecks.find((rule) => !rule.test(password));

  if (failedRule) {
    throw new ApiError(400, failedRule.message);
  }
};

export const validateRequiredString = (value, fieldName, { minLength = 1, maxLength, trim = true } = {}) => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const normalised = trim ? value.trim() : value;

  if (normalised.length < minLength) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  if (typeof maxLength === "number" && normalised.length > maxLength) {
    throw new ApiError(400, `${fieldName} cannot exceed ${maxLength} characters`);
  }

  return normalised;
};

export const validateEmailFormat = (email, fieldName = "Email") => {
  const normalisedEmail = validateRequiredString(email, fieldName).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalisedEmail)) {
    throw new ApiError(400, "Invalid email format");
  }

  return normalisedEmail;
};

export const validateInstitutionalEmail = (email) => {
  const normalisedEmail = validateEmailFormat(email);
  const institutionalRegex = /^[0-9]{9}@dau\.ac\.in$/;

  if (!institutionalRegex.test(normalisedEmail)) {
    throw new ApiError(400, "Email must be a DAU student email");
  }

  return normalisedEmail;
};

export const validateOtpFormat = (otp, fieldName = "OTP") => {
  const value = validateRequiredString(otp, fieldName, { minLength: 6, maxLength: 6, trim: true });

  if (!/^\d{6}$/.test(value)) {
    throw new ApiError(400, `${fieldName} must be a 6-digit code`);
  }

  return value;
};

export const validateObjectId = (value, fieldName = "ID") => {
  const normalised = validateRequiredString(value, fieldName);

  if (!mongoose.Types.ObjectId.isValid(normalised)) {
    throw new ApiError(400, `Invalid ${fieldName.toLowerCase()} format`);
  }

  return normalised;
};

export const parseStrictPositiveInteger = (value, fieldName, { defaultValue = 1, min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsedValue) || parsedValue < min || parsedValue > max) {
    throw new ApiError(400, `${fieldName} must be between ${min} and ${max}`);
  }

  return parsedValue;
};
