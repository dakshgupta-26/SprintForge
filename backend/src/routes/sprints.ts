import { Router } from 'express';
import { createSprint, getSprints, getSprint, updateSprint, startSprint, completeSprint, addTaskToSprint, removeTaskFromSprint, getBurndownData, deleteSprint } from '../controllers/sprintController';
import { protect } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(protect);
router.route('/').get(getSprints).post(requirePermission('manage'), createSprint);
router.route('/:id').get(getSprint).put(requirePermission('manage'), updateSprint);
router.put('/:id/start', requirePermission('manage'), startSprint);
router.put('/:id/complete', requirePermission('manage'), completeSprint);
router.post('/:id/tasks', requirePermission('edit'), addTaskToSprint);
router.delete('/:id/tasks/:taskId', requirePermission('edit'), removeTaskFromSprint);
router.get('/:id/burndown', getBurndownData);
router.delete('/:id', requirePermission('manage'), deleteSprint);

export default router;
