import { Router } from 'express';
import { 
  createProject, getProjects, getProject, updateProject, deleteProject, 
  inviteMember, removeMember, getInviteInfo, acceptInvite, getProjectInvites,
  generateJoinCode, disableJoinCode, joinWithCode, updateMemberRole
} from '../controllers/projectController';
import { protect } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Public route for fetching invite info
router.get('/invites/:token', getInviteInfo);

// Protected routes
router.use(protect);
router.post('/invites/:token/accept', acceptInvite);
router.post('/join-with-code', joinWithCode);

router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).put(requirePermission('manage'), updateProject).delete(requirePermission('manage'), deleteProject);
router.get('/:id/invites', requirePermission('manage'), getProjectInvites);
router.post('/:id/invite', requirePermission('manage'), inviteMember);
router.post('/:id/generate-code', requirePermission('manage'), generateJoinCode);
router.post('/:id/disable-code', requirePermission('manage'), disableJoinCode);
router.patch('/:id/members/:userId/role', requirePermission('manage'), updateMemberRole);
router.delete('/:id/members/:userId', requirePermission('manage'), removeMember);

export default router;
