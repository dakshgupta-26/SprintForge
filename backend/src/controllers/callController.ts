import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Call from '../models/Call';
import Project from '../models/Project';

/**
 * Get call history for a specific project
 */
export const getProjectCalls = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 30;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const calls = await Call.find({ project: projectId })
      .populate('caller', 'name avatar email role')
      .populate('receiver', 'name avatar email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Call.countDocuments({ project: projectId });

    res.json({
      calls,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get recent calls for a project (compact for quick display)
 */
export const getRecentCalls = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const calls = await Call.find({ project: projectId })
      .populate('caller', 'name avatar email')
      .populate('receiver', 'name avatar email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json(calls);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get unread missed call counts grouped by project for current user
 */
export const getUnreadMissedCalls = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Find missed calls where current user was receiver and isRead is false
    const missedCalls = await Call.find({
      receiver: userId,
      status: 'missed',
      isRead: false,
    }).select('project');

    const projectCounts: Record<string, number> = {};
    let totalUnread = 0;

    missedCalls.forEach((call) => {
      const pId = String(call.project);
      projectCounts[pId] = (projectCounts[pId] || 0) + 1;
      totalUnread++;
    });

    res.json({
      totalUnread,
      projects: projectCounts,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Mark a specific call as read
 */
export const markCallAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { callId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(callId)) {
      return res.status(400).json({ message: 'Invalid call ID' });
    }

    const call = await Call.findOneAndUpdate(
      { _id: callId, receiver: req.user._id },
      { isRead: true },
      { returnDocument: 'after' }
    );

    if (!call) {
      return res.status(404).json({ message: 'Call not found or unauthorized' });
    }

    res.json({ message: 'Call marked as read', call });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Mark all missed calls in a project as read for current user
 */
export const markAllProjectCallsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    await Call.updateMany(
      {
        project: projectId,
        receiver: req.user._id,
        isRead: false,
      },
      { isRead: true }
    );

    res.json({ message: 'All project calls marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fallback REST endpoint to safely end a call if socket dropped abruptly
 */
export const endCallFallback = async (req: AuthRequest, res: Response) => {
  try {
    const { callId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(callId)) {
      return res.status(400).json({ message: 'Invalid call ID' });
    }

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    const userId = String(req.user._id);
    if (String(call.caller) !== userId && String(call.receiver) !== userId) {
      return res.status(403).json({ message: 'Unauthorized to modify this call' });
    }

    if (call.status === 'connected' || call.status === 'initiated' || call.status === 'ringing' || call.status === 'accepted') {
      const now = new Date();
      const duration = call.connectedAt ? Math.round((now.getTime() - call.connectedAt.getTime()) / 1000) : 0;
      call.status = call.connectedAt ? 'completed' : 'cancelled';
      call.endedAt = now;
      call.duration = duration;
      await call.save();
    }

    res.json({ message: 'Call ended successfully', call });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
