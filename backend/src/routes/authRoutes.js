import express from 'express';
import 
{
    signup,
    verifyOTP,
    login,
    googleLogin,
    forgotPassword,
    resetPassword,
    resendOTP,
    getCurrentUser,
    refreshAccessToken,
    logout
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter, authStrictRateLimiter, otpRateLimiter } from '../middleware/security.middleware.js';

const router = express.Router();

router.post('/signup', authStrictRateLimiter, signup);
router.post('/verify-otp', otpRateLimiter, verifyOTP);
router.post('/resend-otp', otpRateLimiter, resendOTP);
router.post('/login', authStrictRateLimiter, login);
router.post('/google', authStrictRateLimiter, googleLogin);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);

export default router;