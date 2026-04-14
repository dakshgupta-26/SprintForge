import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Sprint from '../models/Sprint';
import Task from '../models/Task';
import Notification from '../models/Notification';

export const createSprint = async (req: AuthRequest, res: Response) => {
  try {
    const { name, goal, project, startDate, endDate } = req.body;
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    const sprint = await Sprint.create({ name, goal, project, startDate, endDate, createdBy: req.user._id });
    res.status(201).json(sprint);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSprints = async (req: AuthRequest, res: Response) => {
  try {
    const { project } = req.query;
    const sprints = await Sprint.find({ project })
      .populate({ path: 'tasks', populate: { path: 'assignees', select: 'name avatar' } })
      .sort({ createdAt: -1 });
    res.json(sprints);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSprint = async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id)
      .populate({ path: 'tasks', populate: [{ path: 'assignees', select: 'name avatar' }, { path: 'reporter', select: 'name avatar' }] });
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    res.json(sprint);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSprint = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.body;
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    const sprint = await Sprint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    res.json(sprint);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const startSprint = async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await Sprint.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    // Calculate total story points
    const tasks = await Task.find({ sprint: sprint._id });
    const totalPoints = tasks.reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);
    sprint.totalPoints = totalPoints;
    await sprint.save();
    res.json(sprint);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const completeSprint = async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('tasks');
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    
    const allTasks = sprint.tasks as any[];
    const completedTasks = allTasks.filter((t: any) => t.status === 'done');
    const incompleteTasks = allTasks.filter((t: any) => t.status !== 'done');
    
    const completedPoints = completedTasks.reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);
    
    for (const task of incompleteTasks) {
      await Task.findByIdAndUpdate(task._id, { sprint: null, status: 'todo', boardColumn: 'todo' });
    }
    
    sprint.status = 'completed';
    sprint.completedPoints = completedPoints;
    sprint.velocity = completedPoints;
    sprint.tasks = completedTasks.map(t => t._id) as any;
    
    await sprint.save();
    res.json(sprint);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addTaskToSprint = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.body;
    await Task.findByIdAndUpdate(taskId, { sprint: req.params.id });
    await Sprint.findByIdAndUpdate(req.params.id, { $addToSet: { tasks: taskId } });
    res.json({ message: 'Task added to sprint' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const removeTaskFromSprint = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    await Task.findByIdAndUpdate(taskId, { sprint: null, status: 'todo', boardColumn: 'todo' });
    await Sprint.findByIdAndUpdate(req.params.id, { $pull: { tasks: taskId } });
    res.json({ message: 'Task moved to backlog' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBurndownData = async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('tasks');
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalPoints = (sprint.tasks as any[]).reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);
    const data = [];
    for (let i = 0; i <= dayCount; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const completedByDay = (sprint.tasks as any[])
        .filter((t: any) => t.completedAt && new Date(t.completedAt) <= date)
        .reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);
      data.push({
        day: i, date: date.toISOString().split('T')[0],
        remaining: Math.max(0, totalPoints - completedByDay),
        ideal: Math.round(totalPoints - (totalPoints / dayCount) * i),
      });
    }
    res.json({ sprint, totalPoints, data });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSprint = async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    
    // Move tasks to backlog globally
    await Task.updateMany({ sprint: sprint._id }, { sprint: null, status: 'todo', boardColumn: 'todo' });
    
    await Sprint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sprint deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
