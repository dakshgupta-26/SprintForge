import { Router } from 'express';
import {
  getProjectCalls,
  getRecentCalls,
  getUnreadMissedCalls,
  markCallAsRead,
  markAllProjectCallsAsRead,
  endCallFallback,
} from '../controllers/callController';
import { protect } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(protect);

// Global unread aggregation for current user
router.get('/unread', getUnreadMissedCalls);

// Project-specific calls
router.get('/project/:projectId', requirePermission('view'), getProjectCalls);
router.get('/project/:projectId/recent', requirePermission('view'), getRecentCalls);
router.post('/project/:projectId/read-all', markAllProjectCallsAsRead);

// Call-specific actions
router.patch('/:callId/read', markCallAsRead);
router.post('/:callId/end', endCallFallback);

export default router;
