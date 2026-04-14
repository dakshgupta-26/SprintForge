import { Router } from 'express';
import { getProjectAnalytics, getTeamProductivity } from '../controllers/analyticsController';
import { protect } from '../middleware/auth';

const router = Router();
router.use(protect);
router.get('/project/:projectId', getProjectAnalytics);
router.get('/project/:projectId/team', getTeamProductivity);

export default router;
