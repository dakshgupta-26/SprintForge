import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Task from '../models/Task';
import Sprint from '../models/Sprint';
import Notification from '../models/Notification';
import Comment from '../models/Comment';

// ─── AI Estimation Helper ───────────────────────────────────────────────────
const estimateStoryPoints = (title: string, description: string, priority: string): number => {
  const wordCount = (title + ' ' + description).split(' ').length;
  const complexityScore = Math.min(Math.ceil(wordCount / 10), 8);
  const multiplierMap: Record<string, number> = { low: 1, medium: 1.5, high: 2, critical: 3 };
  const priorityMultiplier = multiplierMap[priority] ?? 1;
  const fibonacci = [1, 2, 3, 5, 8, 13, 21];
  const rawEstimate = Math.round(complexityScore * priorityMultiplier);
  return fibonacci[Math.min(rawEstimate - 1, fibonacci.length - 1)] ?? 3;
};

// ─── Create Task ────────────────────────────────────────────────────────────
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title, description, type, priority, project, sprint,
      assignees, labels, storyPoints, dueDate, boardColumn,
    } = req.body;

    const aiEstimate = estimateStoryPoints(title, description || '', priority || 'medium');

    const task = await Task.create({
      title, description, type, priority, project, sprint,
      assignees, labels,
      storyPoints: storyPoints || aiEstimate,
      dueDate, boardColumn: boardColumn || 'todo',
      reporter: req.user!._id,
      aiEstimate,
    });

    if (sprint) {
      await Sprint.findByIdAndUpdate(sprint, { $push: { tasks: task._id } });
    }

    // Notify assignees
    if (Array.isArray(assignees) && assignees.length) {
      const notifications = assignees.map((userId: string) => ({
        recipient: userId,
        sender: req.user!._id,
        type: 'task_assigned',
        title: 'New task assigned',
        message: `You were assigned to: ${title}`,
        link: `/tasks/${task._id}`,
      }));
      await Notification.insertMany(notifications);

      const io = req.app.get('io');
      assignees.forEach((userId: string) =>
        io?.to(userId).emit('notification', { type: 'task_assigned' })
      );
    }

    const populated = await task.populate(['assignees', 'reporter']);

    // Broadcast new task to all project room members in real time
    const io = req.app.get('io');
    io?.to(`project:${String(task.project)}`).emit('task:created', populated);

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Tasks (with filters) ───────────────────────────────────────────────
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { project, sprint, status, assignee, type, priority, search } = req.query;
    const filter: Record<string, any> = {};

    if (project)  filter.project   = project;
    if (sprint)   filter.sprint    = sprint;
    if (status)   filter.status    = status;
    if (assignee) filter.assignees = assignee;
    if (type)     filter.type      = type;
    if (priority) filter.priority  = priority;
    if (search)   filter.title     = { $regex: String(search), $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('assignees', 'name avatar email')
      .populate('reporter',  'name avatar')
      .sort({ boardOrder: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Single Task ────────────────────────────────────────────────────────
export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name avatar email')
      .populate('reporter',  'name avatar email')
      .populate('subtasks')
      .populate({ path: 'comments', populate: { path: 'author', select: 'name avatar' } });

    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Task ────────────────────────────────────────────────────────────
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignees', 'name avatar email')
      .populate('reporter',  'name avatar');

    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }

    const io = req.app.get('io');
    io?.to(`project:${String(task.project)}`).emit('task:updated', task);
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Task Status (drag-and-drop) ────────────────────────────────────
export const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, boardColumn, boardOrder } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        status,
        boardColumn,
        boardOrder,
        ...(status === 'done' ? { completedAt: new Date() } : {}),
      },
      { new: true }
    ).populate('assignees', 'name avatar');

    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }

    const io = req.app.get('io');
    io?.to(`project:${String(task.project)}`).emit('task:moved', {
      taskId: task._id, status, boardColumn, boardOrder,
    });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Task ────────────────────────────────────────────────────────────
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }

    if (task.sprint) {
      await Sprint.findByIdAndUpdate(task.sprint, { $pull: { tasks: task._id } });
    }
    res.json({ message: 'Task deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Add Comment ────────────────────────────────────────────────────────────
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    const taskId = new mongoose.Types.ObjectId(String(req.params.id));

    const [comment] = await Comment.create([{
      content,
      author: req.user._id,
      task: taskId,
    }]);

    if (!comment) { res.status(500).json({ message: 'Failed to create comment' }); return; }

    await Task.findByIdAndUpdate(taskId, { $push: { comments: comment._id } });

    const populated = await comment.populate('author', 'name avatar');
    const io = req.app.get('io');
    io?.to(`task:${req.params.id}`).emit('comment:added', populated);

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Backlog ────────────────────────────────────────────────────────────
export const getBacklog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId, sprint: null })
      .populate('assignees', 'name avatar')
      .sort({ boardOrder: 1 });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
