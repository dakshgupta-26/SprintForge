import { Router } from 'express';
import { protect } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(protect);

// ─── Create Issue (stored as Task with type='bug' or specified type) ──────────
router.post('/', requirePermission('create'), async (req: any, res) => {
  try {
    const Task = require('../models/Task').default;
    const issue = await Task.create({
      ...req.body,
      type: req.body.type || 'bug',
      reporter: req.user._id,
      boardOrder: Date.now(),
    });

    const populated = await Task.findById(issue._id)
      .populate('assignees', 'name avatar email')
      .populate('reporter', 'name avatar email')
      .populate('sprint', 'name status startDate endDate')
      .populate('comments');

    const io = req.app.get('io');
    io?.to(`project:${String(issue.project)}`).emit('task:created', populated);

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Get Issues (filtered view for project) ──────────────────────────────────
router.get('/', requirePermission('view'), async (req: any, res) => {
  try {
    const Task = require('../models/Task').default;
    const { project } = req.query;
    const issues = await Task.find({ project, type: { $in: ['bug', 'incident', 'task', 'story', 'epic'] } })
      .populate('assignees', 'name avatar email')
      .populate('reporter', 'name avatar email')
      .populate('sprint', 'name status startDate endDate')
      .populate('comments')
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
