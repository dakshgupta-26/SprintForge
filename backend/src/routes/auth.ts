import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  getMe,
  updateProfile,
  changePassword,
  uploadAvatar,
  getAvatar,
  removeAvatar,
  logout,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// GridFS Avatar Endpoints
router.get('/avatar/:userId', getAvatar);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, removeAvatar);

router.post('/logout', logout);

export default router;
