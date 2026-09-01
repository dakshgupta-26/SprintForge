import { Router } from 'express';
import { protect } from '../middleware/auth';
import User from '../models/User';
import Project from '../models/Project';
import Task from '../models/Task';
import mongoose from 'mongoose';

const router = Router();
router.use(protect);

// ─── 1. Search Users ────────────────────────────────────────────────────────
router.get('/search', async (req: any, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json([]);
    }

    // Escape regex special characters to prevent ReDoS and logic errors
    const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const users = await User.find({
      $or: [
        { name: { $regex: escapedQ, $options: 'i' } },
        { email: { $regex: escapedQ, $options: 'i' } },
      ],
    })
      .select('name email avatar title')
      .limit(10);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 2. Get Public Member Profile ───────────────────────────────────────────
router.get('/members/:userId/profile', async (req: any, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid member ID' });
    }

    // Find the target user with safe public fields
    const targetUser = await User.findById(userId).select(
      'name email avatar role emailVerified bio title location website timezone language createdAt lastSeen'
    );

    if (!targetUser) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Verify workspace/project relationship for authorization
    const isSelf = requesterId === userId;

    // Fetch projects accessible by the requester
    const requesterProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id name key color type owner members');

    const requesterProjectIds = requesterProjects.map((p) => p._id);

    // Find shared projects between requester and target member
    const sharedProjects = requesterProjects
      .filter((p) => {
        const isOwner = p.owner.toString() === userId;
        const isMember = p.members.some(
          (m: any) => (m.user?._id || m.user).toString() === userId
        );
        return isSelf || isOwner || isMember;
      })
      .map((p) => {
        const isOwner = p.owner.toString() === userId;
        const memberRecord = p.members.find(
          (m: any) => (m.user?._id || m.user).toString() === userId
        );
        return {
          _id: p._id,
          name: p.name,
          key: p.key,
          color: p.color,
          type: p.type,
          role: isOwner ? 'Owner' : memberRecord?.role || 'Member',
          isOwner,
        };
      });

    // If viewing someone else, ensure they share at least one project or are in the workspace
    if (!isSelf && sharedProjects.length === 0 && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'You do not share any active workspaces with this member' });
    }

    // Query tasks assigned to the target user in projects the requester has access to
    const assignedTasks = await Task.find({
      assignees: targetUser._id,
      project: { $in: requesterProjectIds },
    })
      .select('title status priority dueDate project createdAt')
      .populate('project', 'name key color')
      .sort({ updatedAt: -1 })
      .limit(10);

    // Calculate real stats
    const totalTasks = await Task.countDocuments({
      assignees: targetUser._id,
      project: { $in: requesterProjectIds },
    });

    const completedTasks = await Task.countDocuments({
      assignees: targetUser._id,
      project: { $in: requesterProjectIds },
      status: 'done',
    });

    const inProgressTasks = await Task.countDocuments({
      assignees: targetUser._id,
      project: { $in: requesterProjectIds },
      status: 'in_progress',
    });

    const activeTasks = Math.max(0, totalTasks - completedTasks);

    res.json({
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        avatar: targetUser.avatar,
        role: targetUser.role,
        title: targetUser.title || '',
        bio: targetUser.bio || '',
        location: targetUser.location || '',
        website: targetUser.website || '',
        timezone: targetUser.timezone || 'UTC',
        language: targetUser.language || 'English (US)',
        emailVerified: targetUser.emailVerified || false,
        createdAt: targetUser.createdAt,
        lastSeen: targetUser.lastSeen,
      },
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        activeTasks,
        projectsCount: sharedProjects.length,
      },
      assignedTasks: assignedTasks.map((t) => ({
        _id: t._id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        project: t.project,
        createdAt: t.createdAt,
      })),
      projects: sharedProjects,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
