import test from "node:test";
import assert from "node:assert/strict";
import { buildAuthSessionPayload } from "../src/utils/authResponse.js";
import { extractBearerToken } from "../src/middleware/auth.middleware.js";
import { assertCanAuthenticate } from "../src/controllers/auth.controller.js";

const createUser = (overrides = {}) => ({
  _id: "64b5d8f0f1f1f1f1f1f1f1f1",
  name: "Student Name",
  email: "123456789@dau.ac.in",
  phone: "9999999999",
  username: "student",
  avatar: "https://example.com/avatar.jpg",
  avatarPublicId: "avatars/student",
  bio: "Bio",
  college: "Dau",
  city: "City",
  state: "State",
  country: "Country",
  isVerified: true,
  authProvider: "local",
  accountStatus: "active",
  password: "hashed-password",
  refreshToken: "existing-refresh-token",
  otp: "123456",
  otpExpiry: new Date(),
  resetPasswordOtp: "654321",
  resetPasswordOtpExpiry: new Date(),
  __v: 9,
  ...overrides,
});

test("buildAuthSessionPayload returns only public user fields", () => {
  const payload = buildAuthSessionPayload(createUser(), "access-token");

  assert.equal(payload.accessToken, "access-token");
  assert.equal(payload.user._id, "64b5d8f0f1f1f1f1f1f1f1f1");
  assert.equal(payload.user.email, "123456789@dau.ac.in");
  assert.equal(payload.user.authProvider, "local");
  assert.equal(payload.user.accountStatus, "active");
  assert.equal(payload.user.password, undefined);
  assert.equal(payload.user.refreshToken, undefined);
  assert.equal(payload.user.otp, undefined);
  assert.equal(payload.user.otpExpiry, undefined);
  assert.equal(payload.user.resetPasswordOtp, undefined);
  assert.equal(payload.user.resetPasswordOtpExpiry, undefined);
  assert.equal(payload.user.__v, undefined);
});

test("extractBearerToken accepts a valid bearer header", () => {
  assert.equal(extractBearerToken("Bearer abc123"), "abc123");
});

test("extractBearerToken rejects missing or malformed headers", () => {
  assert.throws(() => extractBearerToken(undefined), /Authorization token missing/);
  assert.throws(() => extractBearerToken("Token abc123"), /Bearer scheme/);
  assert.throws(() => extractBearerToken("Bearer   "), /Authorization token missing/);
});

test("assertCanAuthenticate rejects suspended accounts", () => {
  assert.throws(
    () => assertCanAuthenticate(createUser({ accountStatus: "suspended" })),
    /Account is not active/
  );
});

test("assertCanAuthenticate accepts active accounts", () => {
  assert.doesNotThrow(() => assertCanAuthenticate(createUser()));
});