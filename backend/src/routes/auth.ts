import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword, uploadAvatar, logout } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/logout', logout);

export default router;
