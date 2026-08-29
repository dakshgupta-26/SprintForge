import { Router } from 'express';
import { getProjectAnalytics, getTeamProductivity } from '../controllers/analyticsController';
import { protect } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(protect);

// RBAC: Require view permission on the project to access analytics
router.get('/project/:projectId', requirePermission('view'), getProjectAnalytics);
router.get('/project/:projectId/team', requirePermission('view'), getTeamProductivity);

export default router;
