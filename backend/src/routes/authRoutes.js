import express from 'express';
import 
{
    signup,
    verifyOTP,
    login,
    forgotPassword,
    resetPassword,
    resendOTP
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;