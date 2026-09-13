import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { AuthRequest } from '../middleware/auth';
import Project from '../models/Project';
import User from '../models/User';
import Task from '../models/Task';
import Sprint from '../models/Sprint';
import Wiki from '../models/Wiki';
import Message from '../models/Message';
import ChatReadCursor from '../models/ChatReadCursor';
import Call from '../models/Call';
import Comment from '../models/Comment';
import CodeWorkspace from '../models/CodeWorkspace';
import CodePermission from '../models/CodePermission';
import CodeDocumentVersion from '../models/CodeDocumentVersion';
import CodeActivity from '../models/CodeActivity';
import Invitation from '../models/Invitation';
import Notification from '../models/Notification';
import ProjectActivity, { ProjectActivityAction } from '../models/ProjectActivity';
import { sendInviteEmail } from '../services/emailService';
import {
  uploadProjectImageToGridFS,
  getProjectImagesBucket,
  deleteGridFSFile,
} from '../utils/gridfs';

// ─── Activity Logger Helper ──────────────────────────────────────────────────
export async function logProjectActivity(opts: {
  project: any;
  actor: any;
  action: ProjectActivityAction;
  details: string;
  target?: { id?: any; type?: string; name?: string };
  metadata?: Record<string, any>;
  io?: any;
}) {
  try {
    const projectId = opts.project._id || opts.project;
    const actorId = opts.actor._id || opts.actor;

    const activity = await ProjectActivity.create({
      project: projectId,
      actor: actorId,
      action: opts.action,
      details: opts.details,
      target: opts.target,
      metadata: opts.metadata || {},
    });

    if (opts.io) {
      const populated = await ProjectActivity.findById(activity._id).populate(
        'actor',
        'name email avatar'
      );
      opts.io.to(`project:${projectId}`).emit('project:activity', populated);
    }

    return activity;
  } catch (err) {
    console.warn('[AUDIT] Failed to write project activity log:', err);
  }
}

// ─── Helper: notify all project admins/owner ──────────────────────────────────
async function notifyProjectAdmins(opts: {
  project: any;
  excludeUserId: string;
  type: string;
  title: string;
  message: string;
  link: string;
  io: any;
}) {
  const { project, excludeUserId, type, title, message, link, io } = opts;

  const recipientIds = new Set<string>();
  recipientIds.add(String(project.owner));
  (project.members as any[]).forEach((m) => {
    const role = (m.role || '').toLowerCase();
    if (role === 'admin' || role === 'owner') {
      recipientIds.add(String(m.user?._id || m.user));
    }
  });
  recipientIds.delete(excludeUserId);

  for (const recipientId of recipientIds) {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: excludeUserId,
      type,
      title,
      message,
      link,
      data: { projectId: project._id },
    });
    if (io) {
      io.to(recipientId).emit('notification:new', notification);
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Returns default permission set for a given role */
const getDefaultPermissions = (roleName: string): ('view' | 'create' | 'edit' | 'delete' | 'manage')[] => {
  const r = roleName.toLowerCase();
  if (r === 'owner' || r === 'admin') return ['view', 'create', 'edit', 'delete', 'manage'];
  if (r === 'viewer') return ['view'];
  return ['view', 'create', 'edit'];
};

/** Generates a cryptographically random 6-char uppercase alphanumeric code */
function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// ─── Startup Migration ─────────────────────────────────────────────────────────

/**
 * Ensures backwards compatibility for all projects created before ownership upgrade:
 * 1. Assigns creator/owner as OWNER role in members list.
 * 2. Ensures owner has full permissions.
 * 3. Ensures owner's user.projects references the project.
 */
export async function migrateExistingProjects(): Promise<void> {
  try {
    const projects = await Project.find({});
    for (const project of projects) {
      let changed = false;

      // Ensure owner is present in members with role 'owner'
      const ownerIdStr = String(project.owner);
      let ownerMemberIndex = project.members.findIndex(
        (m: any) => String(m.user?._id || m.user) === ownerIdStr
      );

      if (ownerMemberIndex === -1) {
        project.members.unshift({
          user: project.owner,
          role: 'owner',
          permissions: ['view', 'create', 'edit', 'delete', 'manage'],
          joinedAt: (project as any).createdAt || new Date(),
        } as any);
        changed = true;
      } else {
        const ownerMember = project.members[ownerMemberIndex];
        if (ownerMember.role !== 'owner') {
          ownerMember.role = 'owner';
          ownerMember.permissions = ['view', 'create', 'edit', 'delete', 'manage'];
          changed = true;
        }
      }

      // Ensure default settings exist
      if (!project.settings) {
        project.settings = {
          allowAdminMemberManagement: true,
          allowAdminProjectEdit: true,
        };
        changed = true;
      }

      if (changed) {
        await project.save();
        await User.findByIdAndUpdate(project.owner, { $addToSet: { projects: project._id } });
      }
    }
    console.log(`✅ Project ownership migration verified (${projects.length} projects checked)`);
  } catch (err) {
    console.warn('⚠️ Non-blocking project migration error:', err);
  }
}

// ─── CRUD ──────────────────────────────────────────────────────────────────────

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, key, description, type, isPrivate, color, icon, startDate, endDate } = req.body;

    if (!name || !key) {
      return res.status(400).json({ message: 'Project name and key are required' });
    }

    const project = await Project.create({
      name: name.trim(),
      key: key.toUpperCase().trim(),
      description: description || '',
      type: type || 'scrum',
      isPrivate: Boolean(isPrivate),
      color: color || '#6366f1',
      icon,
      startDate,
      endDate,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'owner',
          permissions: ['view', 'create', 'edit', 'delete', 'manage'],
          joinedAt: new Date(),
        },
      ],
      settings: {
        allowAdminMemberManagement: true,
        allowAdminProjectEdit: true,
      },
    });

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { projects: project._id } });

    // Log Activity
    const io = req.app.get('io');
    await logProjectActivity({
      project: project._id,
      actor: req.user._id,
      action: 'PROJECT_CREATED',
      details: `${req.user.name} created the project "${project.name}"`,
      io,
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email');

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    })
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email')
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email')
      .populate('sprints');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const userIdStr = String(req.user._id);
    const isOwner = String(project.owner?._id || project.owner) === userIdStr;
    const memberEntry = (project.members as any[]).find(
      (m: any) => String(m.user?._id || m.user) === userIdStr
    );

    if (!isOwner && !memberEntry && project.isPrivate) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    const userRole = isOwner ? 'owner' : memberEntry?.role || 'member';

    const projectJson: any = project.toJSON();
    projectJson.isOwner = isOwner;
    projectJson.userRole = userRole;

    res.json(projectJson);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const userIdStr = String(req.user._id);
    const isOwner = String(project.owner) === userIdStr;
    const memberEntry = (project.members as any[]).find(
      (m: any) => String(m.user?._id || m.user) === userIdStr
    );

    if (!isOwner) {
      if (!memberEntry || (memberEntry.role || '').toLowerCase() !== 'admin') {
        return res.status(403).json({ message: 'Only project owners and administrators can edit project settings' });
      }
      if (project.settings?.allowAdminProjectEdit === false) {
        return res.status(403).json({ message: 'Project settings editing is restricted to the owner' });
      }
    }

    // Whitelist allowed fields to prevent IDOR or unauthorized tampering
    const {
      name,
      description,
      color,
      icon,
      type,
      isPrivate,
      startDate,
      endDate,
      tags,
      settings,
      githubRepo,
      slackWebhook,
    } = req.body;

    const previousName = project.name;
    const previousDesc = project.description;

    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (color !== undefined) project.color = color;
    if (icon !== undefined) project.icon = icon;
    if (type !== undefined) project.type = type;
    if (isPrivate !== undefined) project.isPrivate = Boolean(isPrivate);
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (tags !== undefined && Array.isArray(tags)) project.tags = tags;
    if (githubRepo !== undefined) project.githubRepo = githubRepo;
    if (slackWebhook !== undefined) project.slackWebhook = slackWebhook;

    // Only OWNER can modify admin permission settings
    if (settings && isOwner) {
      project.settings = {
        allowAdminMemberManagement:
          settings.allowAdminMemberManagement !== undefined
            ? Boolean(settings.allowAdminMemberManagement)
            : project.settings?.allowAdminMemberManagement ?? true,
        allowAdminProjectEdit:
          settings.allowAdminProjectEdit !== undefined
            ? Boolean(settings.allowAdminProjectEdit)
            : project.settings?.allowAdminProjectEdit ?? true,
      };
    }

    await project.save();

    const populated = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email')
      .populate('sprints');

    // Audit Log
    const io = req.app.get('io');
    let detailMsg = `${req.user.name} updated project details`;
    if (previousName !== project.name) {
      detailMsg = `${req.user.name} renamed project to "${project.name}"`;
    } else if (previousDesc !== project.description) {
      detailMsg = `${req.user.name} updated project description`;
    }

    await logProjectActivity({
      project: project._id,
      actor: req.user._id,
      action: 'PROJECT_UPDATED',
      details: detailMsg,
      io,
    });

    // Real-time broadcast to all connected project room members
    if (io) {
      io.to(`project:${project._id}`).emit('project:updated', populated);
    }

    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── SAFE CASCADE PROJECT DELETION ───────────────────────────────────────────

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // 1. Strict OWNER authorization check
    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({
        message: 'Forbidden: Only the permanent project owner can delete this project. Admins and members are not authorized.',
      });
    }

    // 2. Strict Project Name Confirmation check
    const { confirmProjectName } = req.body;
    if (!confirmProjectName || confirmProjectName.trim() !== project.name.trim()) {
      return res.status(400).json({
        message: `Project name mismatch. To confirm deletion, type exactly: "${project.name}"`,
      });
    }

    const projectName = project.name;
    const io = req.app.get('io');

    // 3. Cascade Safe Deletions
    // a. Tasks & comments
    const taskIds = await Task.find({ project: projectId }).distinct('_id');
    if (taskIds.length > 0) {
      await Comment.deleteMany({ task: { $in: taskIds } });
      await Task.deleteMany({ project: projectId });
    }

    // b. Sprints
    await Sprint.deleteMany({ project: projectId });

    // c. Wiki
    await Wiki.deleteMany({ project: projectId });

    // d. Messages & Attachments in GridFS
    const messages = await Message.find({ project: projectId }).select('attachments').lean();
    for (const msg of messages) {
      if (Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.fileId) {
            await deleteGridFSFile(att.fileId, 'chatAttachments');
          }
        }
      }
    }
    await Message.deleteMany({ project: projectId });
    await ChatReadCursor.deleteMany({ project: projectId });

    // e. Calls
    await Call.deleteMany({ project: projectId });

    // f. Code Workspaces & Disk Files
    await CodeWorkspace.deleteMany({ project: projectId });
    await CodePermission.deleteMany({ project: projectId });
    await CodeDocumentVersion.deleteMany({ project: projectId });
    await CodeActivity.deleteMany({ project: projectId });

    try {
      const workspaceDir = path.resolve(__dirname, '../../data/workspaces', String(projectId));
      if (fs.existsSync(workspaceDir)) {
        fs.rmSync(workspaceDir, { recursive: true, force: true });
      }
    } catch (fsErr) {
      console.warn('Workspace directory cleanup notice:', fsErr);
    }

    // g. Invitations & Notifications
    await Invitation.deleteMany({ project: projectId });
    await Notification.deleteMany({ 'data.projectId': projectId });

    // h. Project Avatar in GridFS
    if (project.projectImage?.fileId) {
      await deleteGridFSFile(project.projectImage.fileId, 'projectImages');
    }

    // i. Pull project reference from all user accounts (DO NOT delete user accounts!)
    await User.updateMany({ projects: projectId }, { $pull: { projects: projectId } });

    // j. Project Activities
    await ProjectActivity.deleteMany({ project: projectId });

    // k. Delete Project Document
    await Project.findByIdAndDelete(projectId);

    // 4. Real-time broadcast and room eviction
    if (io) {
      io.to(`project:${projectId}`).emit('project:deleted', {
        projectId,
        projectName,
        message: `Project "${projectName}" was permanently deleted by its owner.`,
      });
      // Evict all sockets from the deleted project's room
      io.in(`project:${projectId}`).socketsLeave(`project:${projectId}`);
    }

    res.json({
      success: true,
      message: `Project "${projectName}" and all associated workspace data have been permanently deleted safely.`,
      projectId,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PROJECT IMAGE MANAGEMENT ────────────────────────────────────────────────

export const uploadProjectImage = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check ownership / admin permission
    const userIdStr = String(req.user._id);
    const isOwner = String(project.owner) === userIdStr;
    const member = (project.members as any[]).find(
      (m: any) => String(m.user?._id || m.user) === userIdStr
    );

    if (!isOwner) {
      if (!member || (member.role || '').toLowerCase() !== 'admin') {
        return res.status(403).json({ message: 'Only project owners and administrators can change the project image' });
      }
      if (project.settings?.allowAdminProjectEdit === false) {
        return res.status(403).json({ message: 'Project settings editing is restricted to the owner' });
      }
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // 1. Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image size exceeds maximum limit of 5MB' });
    }

    // 2. Validate MIME type
    const mime = (req.file.mimetype || '').toLowerCase();
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(mime)) {
      return res.status(400).json({ message: 'Invalid image format. Supported formats: PNG, JPEG, WebP' });
    }

    // 3. Inspect buffer magic numbers (Do NOT trust extension alone)
    const buf = req.file.buffer;
    const isPng = buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isJpg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isWebp =
      buf.length >= 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50;

    if (!isPng && !isJpg && !isWebp) {
      return res.status(400).json({ message: 'Corrupt or unverified image file. Please provide a valid PNG, JPG or WebP image.' });
    }

    // 4. Upload buffer to GridFS
    const timestamp = Date.now();
    const ext = isPng ? '.png' : isWebp ? '.webp' : '.jpg';
    const filename = `project_${projectId}_${timestamp}${ext}`;

    const gridFSFileId = await uploadProjectImageToGridFS(buf, filename, mime);

    // 5. Clean up old image from GridFS if existed
    const oldFileId = project.projectImage?.fileId;

    const imageUrl = `/api/projects/${projectId}/image?v=${timestamp}`;
    project.imageUrl = imageUrl;
    project.projectImage = {
      fileId: gridFSFileId as any,
      filename,
      contentType: mime,
      uploadedAt: new Date(),
    };

    await project.save();

    if (oldFileId) {
      try {
        await deleteGridFSFile(oldFileId, 'projectImages');
      } catch (delErr) {
        console.warn('Old project image cleanup notice:', delErr);
      }
    }

    // Audit log
    const io = req.app.get('io');
    await logProjectActivity({
      project: project._id,
      actor: req.user._id,
      action: 'PROJECT_IMAGE_UPDATED',
      details: `${req.user.name} uploaded a new project avatar`,
      io,
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email');

    // Real-time broadcast to all connected clients
    if (io) {
      io.to(`project:${projectId}`).emit('project:updated', populated);
    }

    res.json({
      message: 'Project image updated successfully',
      imageUrl,
      project: populated,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const project = await Project.findById(id);
    if (!project || !project.projectImage?.fileId) {
      return res.status(404).json({ message: 'No project image found' });
    }

    const fileId = new ObjectId(project.projectImage.fileId);
    const bucket = getProjectImagesBucket();

    res.setHeader('Content-Type', project.projectImage.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on('error', () => {
      if (!res.headersSent) {
        res.status(404).json({ message: 'Image not found in storage' });
      }
    });

    return downloadStream.pipe(res);
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

export const removeProjectImage = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check ownership / admin permission
    const userIdStr = String(req.user._id);
    const isOwner = String(project.owner) === userIdStr;
    const member = (project.members as any[]).find(
      (m: any) => String(m.user?._id || m.user) === userIdStr
    );

    if (!isOwner) {
      if (!member || (member.role || '').toLowerCase() !== 'admin') {
        return res.status(403).json({ message: 'Only project owners and administrators can remove the project image' });
      }
      if (project.settings?.allowAdminProjectEdit === false) {
        return res.status(403).json({ message: 'Project settings editing is restricted to the owner' });
      }
    }

    if (project.projectImage?.fileId) {
      await deleteGridFSFile(project.projectImage.fileId, 'projectImages');
    }

    project.imageUrl = undefined;
    project.projectImage = undefined;
    await project.save();

    // Audit log
    const io = req.app.get('io');
    await logProjectActivity({
      project: project._id,
      actor: req.user._id,
      action: 'PROJECT_IMAGE_REMOVED',
      details: `${req.user.name} removed the custom project avatar`,
      io,
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email');

    // Real-time broadcast
    if (io) {
      io.to(`project:${projectId}`).emit('project:updated', populated);
    }

    res.json({
      message: 'Project image removed',
      project: populated,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── MEMBER MANAGEMENT ─────────────────────────────────────────────────────────

export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId, userId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Requester must be OWNER or authorized ADMIN
    const reqUserIdStr = String(req.user._id);
    const isOwner = String(project.owner) === reqUserIdStr;
    const reqMember = (project.members as any[]).find(
      (m) => String(m.user?._id || m.user) === reqUserIdStr
    );

    if (!isOwner) {
      if (!reqMember || (reqMember.role || '').toLowerCase() !== 'admin') {
        return res.status(403).json({ message: 'Only project owners and administrators can remove members' });
      }
      if (project.settings?.allowAdminMemberManagement === false) {
        return res.status(403).json({ message: 'Member management is restricted to the project owner' });
      }
    }

    // OWNER CANNOT REMOVE THEMSELVES
    if (String(project.owner) === String(userId)) {
      return res.status(400).json({
        message: 'The project owner cannot remove themselves from the project. Transfer ownership to another member before leaving.',
      });
    }

    const targetUser = await User.findById(userId).select('name email');
    const targetName = targetUser?.name || 'Member';

    // Remove member from project.members
    project.members = project.members.filter(
      (m: any) => String(m.user?._id || m.user) !== String(userId)
    ) as any;

    await project.save();

    // Remove project from target user's projects array
    await User.findByIdAndUpdate(userId, { $pull: { projects: project._id } });

    // Audit Log
    const io = req.app.get('io');
    await logProjectActivity({
      project: project._id,
      actor: req.user._id,
      action: 'MEMBER_REMOVED',
      details: `${req.user.name} removed ${targetName} from the project`,
      target: { id: new ObjectId(userId), type: 'User', name: targetName },
      io,
    });

    // Real-time notification & eviction
    if (io) {
      // 1. Broadcast to project room that member was removed
      io.to(`project:${project._id}`).emit('project:member_removed', {
        projectId: project._id,
        userId,
      });

      // 2. Notify the removed user directly in their user room
      io.to(String(userId)).emit('project:access_revoked', {
        projectId: String(project._id),
        projectName: project.name,
        message: `You no longer have access to ${project.name}.`,
      });

      // 3. Evict target user's sockets from project room
      const targetSockets = io.sockets.adapter.rooms.get(String(userId));
      if (targetSockets) {
        for (const sId of targetSockets) {
          const s = io.sockets.sockets.get(sId);
          if (s) {
            s.leave(`project:${project._id}`);
          }
        }
      }
    }

    const populated = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email');

    res.json({
      message: `${targetName} removed from project successfully`,
      project: populated,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId, userId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'member'].includes(role.toLowerCase())) {
      return res.status(400).json({ message: 'Role must be either "admin" or "member"' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Only OWNER can change member roles
    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the project owner can change member roles' });
    }

    // Owner's role cannot be modified via role update
    if (String(project.owner) === String(userId)) {
      return res.status(400).json({ message: "Cannot modify the permanent project owner's role" });
    }

    const member = (project.members as any[]).find(
      (m) => String(m.user?._id || m.user) === String(userId)
    );
    if (!member) return res.status(404).json({ message: 'Member not found in project' });

    const targetUser = await User.findById(userId).select('name');
    const targetName = targetUser?.name || 'Member';

    member.role = role.toLowerCase();
    member.permissions = getDefaultPermissions(member.role);

    await project.save();

    // Audit Log
    const io = req.app.get('io');
    await logProjectActivity({
      project: project._id,
      actor: req.user._id,
      action: 'MEMBER_ROLE_CHANGED',
      details: `${req.user.name} changed role for ${targetName} to ${member.role.toUpperCase()}`,
      target: { id: new ObjectId(userId), type: 'User', name: targetName },
      metadata: { newRole: member.role },
      io,
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email');

    if (io) {
      io.to(`project:${project._id}`).emit('project:member_updated', {
        projectId: project._id,
        member,
        project: populated,
      });
    }

    res.json({ message: 'Member role updated successfully', project: populated });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── TRANSFER OWNERSHIP ───────────────────────────────────────────────────────

export const transferOwnership = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const { newOwnerId, confirmProjectName } = req.body;

    if (!newOwnerId) {
      return res.status(400).json({ message: 'New owner ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // 1. Requester must be OWNER
    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the current project owner can transfer ownership' });
    }

    // 2. Exact project name confirmation
    if (!confirmProjectName || confirmProjectName.trim() !== project.name.trim()) {
      return res.status(400).json({
        message: `Project name mismatch. Type "${project.name}" to confirm ownership transfer.`,
      });
    }

    // 3. New owner cannot be current owner
    if (String(req.user._id) === String(newOwnerId)) {
      return res.status(400).json({ message: 'You are already the owner of this project' });
    }

    // 4. Target user must be an existing project member
    const newOwnerMember = (project.members as any[]).find(
      (m) => String(m.user?._id || m.user) === String(newOwnerId)
    );
    if (!newOwnerMember) {
      return res.status(400).json({ message: 'New owner must be an existing member of this project' });
    }

    const targetUser = await User.findById(newOwnerId).select('name email');
    if (!targetUser) return res.status(404).json({ message: 'New owner user not found' });

    // 5. Update ownership:
    // - previous owner becomes 'admin'
    // - new owner becomes 'owner'
    const oldOwnerMember = (project.members as any[]).find(
      (m) => String(m.user?._id || m.user) === String(req.user._id)
    );
    if (oldOwnerMember) {
      oldOwnerMember.role = 'admin';
      oldOwnerMember.permissions = ['view', 'create', 'edit', 'delete', 'manage'];
    }

    newOwnerMember.role = 'owner';
    newOwnerMember.permissions = ['view', 'create', 'edit', 'delete', 'manage'];

    project.owner = new ObjectId(newOwnerId) as any;
    await project.save();

    // Audit Log
    const io = req.app.get('io');
    await logProjectActivity({
      project: project._id,
      actor: req.user._id,
      action: 'OWNERSHIP_TRANSFERRED',
      details: `${req.user.name} transferred project ownership to ${targetUser.name}`,
      target: { id: new ObjectId(newOwnerId), type: 'User', name: targetUser.name },
      io,
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email');

    if (io) {
      io.to(`project:${project._id}`).emit('project:updated', populated);
    }

    res.json({
      message: `Ownership successfully transferred to ${targetUser.name}`,
      project: populated,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PROJECT ACTIVITY AUDIT LOG ───────────────────────────────────────────────

export const getProjectActivity = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // IDOR / Membership check
    const userIdStr = String(req.user._id);
    const isOwner = String(project.owner) === userIdStr;
    const isMember = (project.members as any[]).some(
      (m) => String(m.user?._id || m.user) === userIdStr
    );

    if (!isOwner && !isMember && project.isPrivate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 30;

    const activities = await ProjectActivity.find({ project: projectId })
      .populate('actor', 'name avatar email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await ProjectActivity.countDocuments({ project: projectId });

    res.json({
      activities,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── INVITE MEMBER ─────────────────────────────────────────────────────────────

export const inviteMember = async (req: AuthRequest, res: Response) => {
  try {
    const { email, role } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check permissions
    const reqUserIdStr = String(req.user._id);
    const isOwner = String(project.owner) === reqUserIdStr;
    const reqMember = (project.members as any[]).find(
      (m) => String(m.user?._id || m.user) === reqUserIdStr
    );

    if (!isOwner) {
      if (!reqMember || (reqMember.role || '').toLowerCase() !== 'admin') {
        return res.status(403).json({ message: 'Only project owners and administrators can invite members' });
      }
      if (project.settings?.allowAdminMemberManagement === false) {
        return res.status(403).json({ message: 'Member management is restricted to the project owner' });
      }
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is already a member
    const invitee = await User.findOne({ email: normalizedEmail });
    if (invitee) {
      const alreadyMember = project.members.some(
        (m: any) => String(m.user?._id || m.user) === String(invitee._id)
      );
      if (alreadyMember) {
        return res.status(400).json({ message: 'This user is already a project member' });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    let code = generateShortCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const existingCode = await Invitation.findOne({ code, status: 'pending' });
    if (existingCode) code = generateShortCode();

    let invitation = await Invitation.findOne({
      email: normalizedEmail,
      project: project._id,
      status: 'pending',
    });

    if (invitation) {
      invitation.token = token;
      invitation.code = code;
      invitation.expiresAt = expiresAt;
      invitation.role = (role as any) || 'member';
      invitation.inviter = req.user._id;
      await invitation.save();
    } else {
      invitation = await Invitation.create({
        email: normalizedEmail,
        project: project._id,
        inviter: req.user._id,
        role: role || 'member',
        token,
        code,
        expiresAt,
      });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const acceptUrl = `${clientUrl}/invite/${token}`;
    const joinUrl = `${clientUrl}/join?code=${code}`;

    await sendInviteEmail({
      to: normalizedEmail,
      inviterName: req.user.name,
      projectName: project.name,
      projectColor: project.color || '#6366f1',
      role: role || 'member',
      acceptUrl,
      joinCode: code,
    });

    const io = req.app.get('io');
    if (invitee) {
      const notification = await Notification.create({
        recipient: invitee._id,
        sender: req.user._id,
        type: 'project_invite',
        title: 'Project Invitation',
        message: `${req.user.name} invited you to join ${project.name}`,
        data: { projectId: project._id, inviteToken: token, inviteCode: code },
        link: `/invite/${token}`,
      });

      if (io) {
        io.to(invitee._id.toString()).emit('notification:new', notification);
      }
    }

    // Audit log
    await logProjectActivity({
      project: project._id,
      actor: req.user._id,
      action: 'MEMBER_INVITED',
      details: `${req.user.name} invited ${normalizedEmail} (${role || 'member'})`,
      metadata: { email: normalizedEmail, role: role || 'member' },
      io,
    });

    res.json({
      message: `Invitation sent to ${normalizedEmail} successfully`,
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        code: invitation.code,
        acceptUrl,
        joinUrl,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectInvites = async (req: AuthRequest, res: Response) => {
  try {
    const invites = await Invitation.find({ project: req.params.id, status: 'pending' })
      .populate('inviter', 'name avatar email')
      .sort({ createdAt: -1 });
    res.json(invites);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInviteInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token, status: 'pending' })
      .populate('project', 'name color description icon imageUrl')
      .populate('inviter', 'name avatar');

    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation link' });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'This invitation has expired' });
    }

    res.json(invitation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;
    const user = req.user;

    const invitation = await Invitation.findOne({ token, status: 'pending' });
    if (!invitation) return res.status(404).json({ message: 'Invalid or expired invitation' });

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'This invitation has expired' });
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        message: `This invitation was sent to ${invitation.email}. Please log in with that account.`,
      });
    }

    const project = await Project.findById(invitation.project);
    if (!project) return res.status(404).json({ message: 'Project no longer exists' });

    const alreadyMember = project.members.some(
      (m: any) => String(m.user?._id || m.user) === String(user._id)
    );
    if (!alreadyMember) {
      const permissions = getDefaultPermissions(invitation.role);
      project.members.push({
        user: user._id as any,
        role: invitation.role,
        permissions,
        joinedAt: new Date(),
      });
      await project.save();
      await User.findByIdAndUpdate(user._id, { $addToSet: { projects: project._id } });
    }

    invitation.status = 'accepted';
    await invitation.save();

    const io = req.app.get('io');
    await notifyProjectAdmins({
      project,
      excludeUserId: String(user._id),
      type: 'user_joined',
      title: `${user.name} joined ${project.name}`,
      message: `${user.name} accepted an invite and joined the project.`,
      link: `/dashboard/projects/${project._id}/team`,
      io,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email')
      .populate('sprints');

    res.json({ message: 'You have joined the project! 🎉', projectId: project._id, project: populatedProject });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptInviteByCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Invite code is required' });

    const user = req.user;
    const upperCode = code.trim().toUpperCase();

    const invitation = await Invitation.findOne({ code: upperCode, status: 'pending' });
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid invite code. Check the code and try again.' });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'This invitation code has expired' });
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        message: `This invite code was sent to ${invitation.email}. Please log in with that account.`,
      });
    }

    const project = await Project.findById(invitation.project);
    if (!project) return res.status(404).json({ message: 'Project no longer exists' });

    const alreadyMember = project.members.some(
      (m: any) => String(m.user?._id || m.user) === String(user._id)
    );
    if (!alreadyMember) {
      const permissions = getDefaultPermissions(invitation.role);
      project.members.push({
        user: user._id as any,
        role: invitation.role,
        permissions,
        joinedAt: new Date(),
      });
      await project.save();
      await User.findByIdAndUpdate(user._id, { $addToSet: { projects: project._id } });
    }

    invitation.status = 'accepted';
    await invitation.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email')
      .populate('sprints');

    res.json({ message: 'You have joined the project! 🎉', projectId: project._id, project: populatedProject });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const generateJoinCode = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const code = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
    project.joinCode = code;
    project.joinCodeEnabled = true;
    await project.save();

    res.json({ joinCode: code });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const disableJoinCode = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.joinCodeEnabled = false;
    await project.save();

    res.json({ message: 'Join code disabled' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const joinWithCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Join code is required' });

    const project = await Project.findOne({ joinCode: code.toUpperCase() });
    if (!project || !project.joinCodeEnabled) {
      return res.status(404).json({ message: 'Invalid or expired join code' });
    }

    const alreadyMember = project.members.some(
      (m: any) => String(m.user?._id || m.user) === String(req.user._id)
    );
    if (alreadyMember) {
      const populatedProject = await Project.findById(project._id)
        .populate('owner', 'name avatar email')
        .populate('members.user', 'name avatar email')
        .populate('sprints');

      return res.status(400).json({
        message: 'You are already a member of this project',
        projectId: project._id,
        project: populatedProject,
      });
    }

    const permissions = getDefaultPermissions('member');
    project.members.push({
      user: req.user._id as any,
      role: 'member',
      permissions,
      joinedAt: new Date(),
    });
    await project.save();
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { projects: project._id } });

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${project._id}`).emit('project:member_joined', {
        userId: req.user._id,
        name: req.user.name,
        role: 'member',
      });
    }
    await notifyProjectAdmins({
      project,
      excludeUserId: String(req.user._id),
      type: 'user_joined',
      title: `${req.user.name} joined ${project.name}`,
      message: `${req.user.name} joined via join code and is now a member.`,
      link: `/dashboard/projects/${project._id}/team`,
      io,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email')
      .populate('sprints');

    res.json({ message: 'Successfully joined the project', projectId: project._id, project: populatedProject });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
