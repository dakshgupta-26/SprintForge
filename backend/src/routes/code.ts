import { Router } from 'express';
import { protect } from '../middleware/auth';
import { requireCodePermission } from '../middleware/codeRbac';
import {
  getWorkspace,
  getFileTree,
  readFile,
  writeFile,
  createFile,
  createFolder,
  renamePath,
  deletePath,
  duplicatePath,
  searchFiles,
  getGitStatus,
  getGitDiff,
  commitChanges,
  getBranches,
  switchOrCreateBranch,
  gitPull,
  gitPush,
  getGitHistory,
  getGitHubStatus,
  getGitHubAuthUrl,
  handleGitHubCallback,
  handleGitHubCallbackGet,
  handleGitHubWebhook,
  connectGitHubToken,
  disconnectGitHub,
  listGitHubRepos,
  cloneGitHubRepo,
  getCodePermissions,
  updateCodePermission,
  getCodeActivity,
  getFileVersions,
  getVersionById,
} from '../controllers/codeController';

const router = Router();

// ─── Global GitHub OAuth & Connections (User level) ───────────────────────────
router.get('/github/status', protect, getGitHubStatus);
router.get('/github/auth-url', protect, getGitHubAuthUrl);
router.get('/github/callback', handleGitHubCallbackGet);
router.post('/github/callback', protect, handleGitHubCallback);
router.post('/github/webhook', handleGitHubWebhook);
router.post('/github/connect-token', protect, connectGitHubToken);
router.post('/github/disconnect', protect, disconnectGitHub);
router.get('/github/repos', protect, listGitHubRepos);

// ─── Version Details ──────────────────────────────────────────────────────────
router.get('/versions/:versionId', protect, getVersionById);

// ─── Project Workspace & Files (VIEW Permission) ──────────────────────────────
router.get('/:projectId/workspace', protect, requireCodePermission('VIEW'), getWorkspace);
router.get('/:projectId/files', protect, requireCodePermission('VIEW'), getFileTree);
router.get('/:projectId/files/read', protect, requireCodePermission('VIEW'), readFile);
router.get('/:projectId/search', protect, requireCodePermission('VIEW'), searchFiles);

// ─── File Mutations (EDIT Permission) ─────────────────────────────────────────
router.post('/:projectId/files/write', protect, requireCodePermission('EDIT'), writeFile);
router.post('/:projectId/files/create', protect, requireCodePermission('EDIT'), createFile);
router.post('/:projectId/folders/create', protect, requireCodePermission('EDIT'), createFolder);
router.post('/:projectId/files/rename', protect, requireCodePermission('EDIT'), renamePath);
router.delete('/:projectId/files/delete', protect, requireCodePermission('EDIT'), deletePath);
router.post('/:projectId/files/duplicate', protect, requireCodePermission('EDIT'), duplicatePath);

// ─── Git Operations (VIEW & WRITE Permissions) ────────────────────────────────
router.get('/:projectId/git/status', protect, requireCodePermission('VIEW'), getGitStatus);
router.get('/:projectId/git/diff', protect, requireCodePermission('VIEW'), getGitDiff);
router.get('/:projectId/git/branches', protect, requireCodePermission('VIEW'), getBranches);
router.get('/:projectId/git/history', protect, requireCodePermission('VIEW'), getGitHistory);

router.post('/:projectId/git/commit', protect, requireCodePermission('WRITE'), commitChanges);
router.post('/:projectId/git/branches', protect, requireCodePermission('WRITE'), switchOrCreateBranch);
router.post('/:projectId/git/pull', protect, requireCodePermission('WRITE'), gitPull);
router.post('/:projectId/git/push', protect, requireCodePermission('WRITE'), gitPush);
router.post('/:projectId/github/clone', protect, requireCodePermission('WRITE'), cloneGitHubRepo);

// ─── Permissions & Audit History ──────────────────────────────────────────────
router.get('/:projectId/permissions', protect, requireCodePermission('VIEW'), getCodePermissions);
router.put('/:projectId/permissions/:userId', protect, requireCodePermission('WRITE'), updateCodePermission);

router.get('/:projectId/activity', protect, requireCodePermission('VIEW'), getCodeActivity);
router.get('/:projectId/versions', protect, requireCodePermission('VIEW'), getFileVersions);

export default router;
