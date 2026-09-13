import { Router } from 'express';
import multer from 'multer';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  inviteMember,
  removeMember,
  getInviteInfo,
  acceptInvite,
  acceptInviteByCode,
  getProjectInvites,
  generateJoinCode,
  disableJoinCode,
  joinWithCode,
  updateMemberRole,
  uploadProjectImage,
  getProjectImage,
  removeProjectImage,
  transferOwnership,
  getProjectActivity,
} from '../controllers/projectController';
import { protect } from '../middleware/auth';
import {
  requirePermission,
  requireProjectMember,
  requireProjectOwner,
  requireProjectAdminOrOwner,
} from '../middleware/rbac';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

// ── Public routes (no auth required) ──────────────────────────────────────────
// Fetch invite metadata by token (to show the invite card before login)
router.get('/invites/:token', getInviteInfo);

// Stream project avatar image (caching handled with headers)
router.get('/:id/image', getProjectImage);

// ── Protected routes (JWT required) ───────────────────────────────────────────
router.use(protect);

// Accept invite by long token (from email link)
router.post('/invites/:token/accept', acceptInvite);

// Accept invite by short 6-char code (manual entry on /join page)
router.post('/invites/accept-by-code', acceptInviteByCode);

// Join project via project-wide join code (not email-matched)
router.post('/join-with-code', joinWithCode);

// Project List & Create
router.route('/').get(getProjects).post(createProject);

// Project Details & Mutations
router
  .route('/:id')
  .get(requireProjectMember, getProject)
  .put(requireProjectAdminOrOwner('editProject'), updateProject)
  .patch(requireProjectAdminOrOwner('editProject'), updateProject)
  .delete(requireProjectOwner, deleteProject);

// Project Image Management
router.post(
  '/:id/image',
  requireProjectAdminOrOwner('editProject'),
  upload.single('image'),
  uploadProjectImage
);
router.delete('/:id/image', requireProjectAdminOrOwner('editProject'), removeProjectImage);

// Project Activity Audit Log
router.get('/:id/activity', requireProjectMember, getProjectActivity);

// Transfer Ownership (Strictly OWNER only)
router.post('/:id/transfer-ownership', requireProjectOwner, transferOwnership);

// Invites
router.get('/:id/invites', requireProjectAdminOrOwner('manageMembers'), getProjectInvites);
router.post('/:id/invite', requireProjectAdminOrOwner('manageMembers'), inviteMember);

// Join codes (project-wide)
router.post('/:id/generate-code', requireProjectAdminOrOwner('manageMembers'), generateJoinCode);
router.post('/:id/disable-code', requireProjectAdminOrOwner('manageMembers'), disableJoinCode);

// Member management
router.patch('/:id/members/:userId/role', requireProjectOwner, updateMemberRole);
router.delete('/:id/members/:userId', requireProjectAdminOrOwner('manageMembers'), removeMember);

export default router;
