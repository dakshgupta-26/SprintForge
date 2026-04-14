import { Router } from 'express';
import { protect } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(protect);

// Issues are stored as Tasks with type='bug'
router.post('/', requirePermission('create'), async (req: any, res) => {
  try {
    const Task = require('../models/Task').default;
    const issue = await Task.create({
      ...req.body,
      type: 'bug',
      reporter: req.user._id,
      boardOrder: Date.now()
    });
    res.status(201).json(issue);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// This route just provides a filtered view
router.get('/', requirePermission('view'), async (req: any, res) => {
  try {
    const Task = require('../models/Task').default;
    const { project } = req.query;
    const issues = await Task.find({ project, type: 'bug' })
      .populate('assignees', 'name avatar')
      .populate('reporter', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
