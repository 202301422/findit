import rateLimit from "express-rate-limit";

const defaultRateLimitMessage = "Too many requests, please try again later";

export const createRateLimiter = ({ windowMs, max, message = defaultRateLimitMessage }) => rateLimit({
  windowMs,
  limit: max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res, _next) => {
    res.status(429).json({
      success: false,
      message,
    });
  },
});

const authWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const authStrictWindowMs = Number(process.env.AUTH_STRICT_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const chatWindowMs = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const uploadWindowMs = Number(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);

export const generalApiRateLimiter = createRateLimiter({
  windowMs: Number(process.env.GENERAL_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  max: Number(process.env.GENERAL_RATE_LIMIT_MAX ?? 300),
});

export const authRateLimiter = createRateLimiter({
  windowMs: authWindowMs,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),
});

export const authStrictRateLimiter = createRateLimiter({
  windowMs: authStrictWindowMs,
  max: Number(process.env.AUTH_STRICT_RATE_LIMIT_MAX ?? 5),
});

export const otpRateLimiter = createRateLimiter({
  windowMs: authStrictWindowMs,
  max: Number(process.env.OTP_RATE_LIMIT_MAX ?? 5),
});

export const chatMessageRateLimiter = createRateLimiter({
  windowMs: chatWindowMs,
  max: Number(process.env.CHAT_MESSAGE_RATE_LIMIT_MAX ?? 60),
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: uploadWindowMs,
  max: Number(process.env.UPLOAD_RATE_LIMIT_MAX ?? 20),
});