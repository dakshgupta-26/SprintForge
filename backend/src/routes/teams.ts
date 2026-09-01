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

// ─── 2. Member Profile Controller ───────────────────────────────────────────
const getMemberProfileHandler = async (req: any, res: any) => {
  try {
    const userId = req.params.userId || req.params.memberId || req.params.id;
    const { projectId } = req.query;
    const requesterId = req.user?._id ? String(req.user._id) : null;

    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!userId || typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId.trim())) {
      return res.status(400).json({ message: 'Invalid or missing member ID' });
    }

    const cleanUserId = userId.trim();
    const targetObjId = new mongoose.Types.ObjectId(cleanUserId);
    const requesterObjId = new mongoose.Types.ObjectId(requesterId);
    const isSelf = requesterId === cleanUserId;

    // 1. Find target user with safe public fields
    const targetUser = await User.findById(targetObjId).select(
      'name email avatar role emailVerified bio title location website timezone language createdAt lastSeen'
    );

    if (!targetUser) {
      return res.status(404).json({ message: 'Member profile not found' });
    }

    // 2. Fetch projects accessible by requester
    const requesterProjects = await Project.find({
      $or: [
        { owner: requesterObjId },
        { 'members.user': requesterObjId },
        { owner: requesterId },
        { 'members.user': requesterId },
      ],
    }).select('_id name key color type owner members');

    // 3. Find shared projects with target member
    const sharedProjects: any[] = [];
    for (const p of requesterProjects) {
      const pOwnerId = p.owner ? String(p.owner._id || p.owner) : '';
      const isTargetOwner = pOwnerId === cleanUserId;
      const targetMemberRecord = (p.members || []).find((m: any) => {
        const mUserId = m?.user ? String(m.user._id || m.user) : '';
        return mUserId === cleanUserId;
      });

      if (isSelf || isTargetOwner || Boolean(targetMemberRecord)) {
        sharedProjects.push({
          _id: p._id,
          name: p.name,
          key: p.key,
          color: p.color || '#6366f1',
          type: p.type || 'scrum',
          role: isTargetOwner ? 'Owner' : targetMemberRecord?.role || 'Member',
          isOwner: isTargetOwner,
        });
      }
    }

    // 4. Verify access
    let hasAccess = isSelf || sharedProjects.length > 0 || req.user.role === 'admin';

    // If projectId query is provided, check that specific project as well
    if (!hasAccess && projectId && typeof projectId === 'string' && mongoose.Types.ObjectId.isValid(projectId.trim())) {
      const specificProject = await Project.findOne({
        _id: new mongoose.Types.ObjectId(projectId.trim()),
        $or: [
          { owner: requesterObjId },
          { 'members.user': requesterObjId },
          { owner: requesterId },
          { 'members.user': requesterId },
        ],
      }).select('_id name key color type owner members');

      if (specificProject) {
        const pOwnerId = specificProject.owner ? String(specificProject.owner._id || specificProject.owner) : '';
        const isTargetOwner = pOwnerId === cleanUserId;
        const targetMemberRecord = (specificProject.members || []).find((m: any) => {
          const mUserId = m?.user ? String(m.user._id || m.user) : '';
          return mUserId === cleanUserId;
        });

        if (isTargetOwner || targetMemberRecord) {
          hasAccess = true;
          sharedProjects.push({
            _id: specificProject._id,
            name: specificProject.name,
            key: specificProject.key,
            color: specificProject.color || '#6366f1',
            type: specificProject.type || 'scrum',
            role: isTargetOwner ? 'Owner' : targetMemberRecord?.role || 'Member',
            isOwner: isTargetOwner,
          });
        }
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not share any active workspaces with this member',
      });
    }

    // 5. Fetch assigned tasks in accessible projects
    const accessibleProjectIds: any[] = requesterProjects.map((p) => p._id);
    if (projectId && typeof projectId === 'string' && mongoose.Types.ObjectId.isValid(projectId.trim())) {
      accessibleProjectIds.push(new mongoose.Types.ObjectId(projectId.trim()));
    }

    const assignedTasks = await Task.find({
      assignees: targetObjId,
      project: { $in: accessibleProjectIds },
    })
      .select('title status priority dueDate project createdAt')
      .populate('project', 'name key color')
      .sort({ updatedAt: -1 })
      .limit(10);

    const totalTasks = await Task.countDocuments({
      assignees: targetObjId,
      project: { $in: accessibleProjectIds },
    });

    const completedTasks = await Task.countDocuments({
      assignees: targetObjId,
      project: { $in: accessibleProjectIds },
      status: 'done',
    });

    const inProgressTasks = await Task.countDocuments({
      assignees: targetObjId,
      project: { $in: accessibleProjectIds },
      status: 'in_progress',
    });

    const activeTasks = Math.max(0, totalTasks - completedTasks);

    return res.json({
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        avatar: targetUser.avatar || '',
        role: targetUser.role || 'member',
        title: targetUser.title || '',
        bio: targetUser.bio || '',
        location: targetUser.location || '',
        website: targetUser.website || '',
        timezone: targetUser.timezone || 'UTC',
        language: targetUser.language || 'English (US)',
        emailVerified: Boolean(targetUser.emailVerified),
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
      assignedTasks: assignedTasks.map((t: any) => ({
        _id: t._id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        project: t.project || { name: 'Project', key: 'PROJ', color: '#6366f1' },
        createdAt: t.createdAt,
      })),
      projects: sharedProjects,
    });
  } catch (error: any) {
    console.error('Error in getMemberProfileHandler:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Mount route aliases
router.get('/members/:userId/profile', getMemberProfileHandler);
router.get('/profile/:userId', getMemberProfileHandler);
router.get('/:userId/profile', getMemberProfileHandler);

export default router;
