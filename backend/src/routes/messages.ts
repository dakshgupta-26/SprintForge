import { Router } from 'express';
import { getMessages } from '../controllers/messageController';
import { protect } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(protect); // Ensure all routes require authentication

// Apply RBAC: Must have view permission to fetch messages
router.get('/:projectId', requirePermission('view'), getMessages);

export default router;
