import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  verifyEmailOtp,
  resendEmailOtp,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  setPassword,
  getSessions,
  revokeSession,
  revokeOtherSessions,
  getSecurityActivity,
  uploadAvatar,
  getAvatar,
  removeAvatar,
  logout,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  loginLimiter,
  otpVerifyLimiter,
  otpResendLimiter,
  passwordResetLimiter,
} from '../middleware/rateLimiter';

const router = Router();

// Public Authentication Flow
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/google', googleAuth);
router.post('/verify-email-otp', otpVerifyLimiter, verifyEmailOtp);
router.post('/verify-otp', otpVerifyLimiter, verifyEmailOtp);
router.post('/resend-email-otp', otpResendLimiter, resendEmailOtp);
router.post('/resend-otp', otpResendLimiter, resendEmailOtp);
router.post('/refresh', refreshToken);

// Password Recovery
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Protected User Management
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/set-password', protect, setPassword);

// Active Session Management
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);
router.post('/sessions/revoke-others', protect, revokeOtherSessions);

// Security Audit Activity
router.get('/activity', protect, getSecurityActivity);

// GridFS Avatar Endpoints
router.get('/avatar/:userId', getAvatar);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, removeAvatar);

// Sign out
router.post('/logout', logout);

export default router;
