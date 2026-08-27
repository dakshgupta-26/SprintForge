import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Task from '../models/Task';
import Sprint from '../models/Sprint';

export const getProjectAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    // 1. Task Status Distribution
    const statusDist = await Task.aggregate([
      { $match: { project: projectObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 }, points: { $sum: '$storyPoints' } } },
    ]);

    // 2. Priority Distribution
    const priorityDist = await Task.aggregate([
      { $match: { project: projectObjectId } },
      { $group: { _id: '$priority', count: { $sum: 1 }, points: { $sum: '$storyPoints' } } },
    ]);

    // 3. Work Type Distribution
    const typeDist = await Task.aggregate([
      { $match: { project: projectObjectId } },
      { $group: { _id: '$type', count: { $sum: 1 }, points: { $sum: '$storyPoints' } } },
    ]);

    // 4. Sprint Velocity History
    const sprints = await Sprint.find({ project: projectId, status: 'completed' })
      .sort({ endDate: 1 })
      .limit(10);
    const velocity = sprints.map((s) => ({
      name: s.name,
      completed: s.completedPoints || 0,
      planned: s.totalPoints || 0,
      completionRate: s.totalPoints ? Math.round(((s.completedPoints || 0) / s.totalPoints) * 100) : 0,
    }));

    // 5. Cumulative Flow (tasks created per day for last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cumulativeFlow = await Task.aggregate([
      { $match: { project: projectObjectId, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 6. Cycle Time (avg & median days from creation to completion)
    const completedTasks = await Task.find({ project: projectId, status: 'done' });
    const cycleTimeValues: number[] = [];
    completedTasks.forEach((t) => {
      const endTime = t.completedAt ? new Date(t.completedAt).getTime() : new Date(t.updatedAt).getTime();
      const startTime = new Date(t.createdAt).getTime();
      const days = (endTime - startTime) / (1000 * 60 * 60 * 24);
      if (days >= 0) cycleTimeValues.push(days);
    });

    cycleTimeValues.sort((a, b) => a - b);
    const avgCycleTime = cycleTimeValues.length
      ? cycleTimeValues.reduce((a, b) => a + b, 0) / cycleTimeValues.length
      : 0;
    const medianCycleTime = cycleTimeValues.length
      ? cycleTimeValues[Math.floor(cycleTimeValues.length / 2)]
      : 0;

    // 7. Aging & In-Progress Work (stuck in in_progress or review)
    const agingTasks = await Task.find({
      project: projectId,
      status: { $in: ['in_progress', 'review'] },
    })
      .populate('assignees', 'name avatar')
      .sort({ updatedAt: 1 })
      .limit(6);

    // 8. High Priority / Critical Blockers
    const blockedTasks = await Task.find({
      project: projectId,
      priority: 'critical',
      status: { $ne: 'done' },
    })
      .populate('assignees', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(6);

    // 9. Active Sprint Summary
    const activeSprint = await Sprint.findOne({ project: projectId, status: 'active' });

    // 10. Summary Totals
    const totalTasks = await Task.countDocuments({ project: projectId });
    const doneTasksCount = completedTasks.length;
    const inProgressCount = await Task.countDocuments({
      project: projectId,
      status: { $in: ['in_progress', 'review'] },
    });
    const completionRate = totalTasks > 0 ? Math.round((doneTasksCount / totalTasks) * 100) : 0;

    res.json({
      statusDist,
      priorityDist,
      typeDist,
      velocity,
      cumulativeFlow,
      avgCycleTime: Math.round(avgCycleTime * 10) / 10,
      medianCycleTime: Math.round(medianCycleTime * 10) / 10,
      totalTasks,
      doneTasksCount,
      inProgressCount,
      completionRate,
      agingTasks,
      blockedTasks,
      activeSprint,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeamProductivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    const productivity = await Task.aggregate([
      { $match: { project: projectObjectId } },
      { $unwind: '$assignees' },
      {
        $group: {
          _id: '$assignees',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          inProgress: {
            $sum: { $cond: [{ $in: ['$status', ['in_progress', 'review']] }, 1, 0] },
          },
          storyPoints: { $sum: '$storyPoints' },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          avatar: '$user.avatar',
          email: '$user.email',
          total: 1,
          completed: 1,
          inProgress: 1,
          storyPoints: 1,
        },
      },
    ]);

    res.json(productivity);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
