import { Router } from 'express';
import {
  createProject, getProjects, getProject, updateProject, deleteProject,
  inviteMember, removeMember, getInviteInfo, acceptInvite, acceptInviteByCode,
  getProjectInvites, generateJoinCode, disableJoinCode, joinWithCode, updateMemberRole
} from '../controllers/projectController';
import { protect } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// ── Public routes (no auth required) ──────────────────────────────────────────
// Fetch invite metadata by token (to show the invite card before login)
router.get('/invites/:token', getInviteInfo);

// ── Protected routes (JWT required) ───────────────────────────────────────────
router.use(protect);

// Accept invite by long token (from email link)
router.post('/invites/:token/accept', acceptInvite);

// Accept invite by short 6-char code (manual entry on /join page)
router.post('/invites/accept-by-code', acceptInviteByCode);

// Join project via project-wide join code (not email-matched)
router.post('/join-with-code', joinWithCode);

// CRUD
router.route('/').get(getProjects).post(createProject);
router.route('/:id')
  .get(getProject)
  .put(requirePermission('manage'), updateProject)
  .delete(requirePermission('manage'), deleteProject);

// Invites
router.get('/:id/invites', requirePermission('manage'), getProjectInvites);
router.post('/:id/invite', requirePermission('manage'), inviteMember);

// Join codes (project-wide)
router.post('/:id/generate-code', requirePermission('manage'), generateJoinCode);
router.post('/:id/disable-code', requirePermission('manage'), disableJoinCode);

// Member management
router.patch('/:id/members/:userId/role', requirePermission('manage'), updateMemberRole);
router.delete('/:id/members/:userId', requirePermission('manage'), removeMember);

export default router;
