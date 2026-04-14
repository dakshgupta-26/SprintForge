import { Router } from 'express';
import { createTask, getTasks, getTask, updateTask, updateTaskStatus, deleteTask, addComment, getBacklog } from '../controllers/taskController';
import { protect } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(protect);

router.get('/', requirePermission('view'), getTasks);                                                          // view
router.post('/', requirePermission('create'), createTask);                          // create
router.get('/backlog/:projectId', requirePermission('view'), getBacklog);                                      // view
router.get('/:id', requirePermission('view'), getTask);                                                        // view
router.put('/:id', requirePermission('edit'), updateTask);                          // edit
router.put('/:id/status', requirePermission('edit'), updateTaskStatus);             // edit
router.delete('/:id', requirePermission('delete'), deleteTask);                     // delete
router.post('/:id/comments', requirePermission('create'), addComment);              // create

export default router;

