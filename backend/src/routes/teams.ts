import { Router } from 'express';
import { protect } from '../middleware/auth';
import User from '../models/User';

const router = Router();
router.use(protect);

router.get('/search', async (req: any, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json([]);
    }
    
    // Escape regex special characters to prevent ReDoS and logic errors
    const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const users = await User.find({
      $or: [
        { name: { $regex: escapedQ, $options: 'i' } }, 
        { email: { $regex: escapedQ, $options: 'i' } }
      ],
    }).select('name email avatar title').limit(10);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
