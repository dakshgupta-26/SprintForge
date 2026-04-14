import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Task from '../models/Task';
import Sprint from '../models/Sprint';

export const getProjectAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    // Task status distribution
    const statusDist = await Task.aggregate([
      { $match: { project: new (require('mongoose').Types.ObjectId)(projectId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    // Priority distribution
    const priorityDist = await Task.aggregate([
      { $match: { project: new (require('mongoose').Types.ObjectId)(projectId) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
    // Sprint velocity
    const sprints = await Sprint.find({ project: projectId, status: 'completed' }).sort({ endDate: 1 }).limit(10);
    const velocity = sprints.map((s) => ({
      name: s.name,
      completed: s.completedPoints || 0,
      planned: s.totalPoints || 0,
    }));
    // Cumulative flow (tasks created per day for last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cumulativeFlow = await Task.aggregate([
      { $match: { project: new (require('mongoose').Types.ObjectId)(projectId), createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, status: { $first: '$status' } } },
      { $sort: { _id: 1 } },
    ]);
    // Cycle time (avg days from creation to completion)
    const completedTasks = await Task.find({ project: projectId, completedAt: { $exists: true } });
    const avgCycleTime = completedTasks.length
      ? completedTasks.reduce((sum, t) => {
          const days = (new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / completedTasks.length
      : 0;
    res.json({ statusDist, priorityDist, velocity, cumulativeFlow, avgCycleTime: Math.round(avgCycleTime * 10) / 10 });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeamProductivity = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const productivity = await Task.aggregate([
      { $match: { project: new (require('mongoose').Types.ObjectId)(projectId) } },
      { $unwind: '$assignees' },
      { $group: { _id: '$assignees', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', avatar: '$user.avatar', total: 1, completed: 1 } },
    ]);
    res.json(productivity);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
