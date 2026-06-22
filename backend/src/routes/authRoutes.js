import express from 'express';
import 
{
    signup,
    verifyOTP,
    login,
    googleLogin,
    forgotPassword,
    resetPassword,
    resendOTP
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;