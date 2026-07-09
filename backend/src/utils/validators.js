import ApiError from "./ApiError.js";

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
