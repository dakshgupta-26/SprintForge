import { Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import Project from '../models/Project';
import User from '../models/User';
import Task from '../models/Task';
import Sprint from '../models/Sprint';
import Invitation from '../models/Invitation';
import Notification from '../models/Notification';
import { sendInviteEmail } from '../services/emailService';

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

  // Collect recipients: owner + all members with admin role
  const recipientIds = new Set<string>();
  recipientIds.add(String(project.owner));
  (project.members as any[]).forEach((m) => {
    if ((m.role || '').toLowerCase() === 'admin') {
      recipientIds.add(String(m.user));
    }
  });
  recipientIds.delete(excludeUserId); // don't notify the person who joined

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
    io.to(recipientId).emit('notification:new', notification);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Returns default permission set for a given role */
const getDefaultPermissions = (roleName: string): ('view' | 'create' | 'edit' | 'delete' | 'manage')[] => {
  const r = roleName.toLowerCase();
  if (r === 'admin') return ['view', 'create', 'edit', 'delete', 'manage'];
  if (r === 'viewer') return ['view'];
  return ['view', 'create', 'edit']; // member / developer / etc.
};

/** Generates a cryptographically random 6-char uppercase alphanumeric code */
function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// ─── CRUD ──────────────────────────────────────────────────────────────────────

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, key, description, type, isPrivate, color, icon, startDate, endDate } = req.body;
    const project = await Project.create({
      name, key: key.toUpperCase(), description, type, isPrivate, color, icon, startDate, endDate,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin', permissions: ['view', 'create', 'edit', 'delete', 'manage'] }],
    });
    await User.findByIdAndUpdate(req.user._id, { $push: { projects: project._id } });
    res.status(201).json(project);
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
    const isMember = project.members.some((m: any) => m.user._id.toString() === req.user._id.toString());
    if (!isMember && project.isPrivate) return res.status(403).json({ message: 'Access denied' });
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can delete it' });
    }
    await Task.deleteMany({ project: req.params.id });
    await Sprint.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── INVITE MEMBER ─────────────────────────────────────────────────────────────
// Works the same for both existing and non-existing users:
//   1. Create a pending Invitation (with token + short code)
//   2. Send an email with code + accept link
//   3. For existing users: also send an in-app notification
//   4. The user must click Accept (they are NOT auto-added)
// ───────────────────────────────────────────────────────────────────────────────
export const inviteMember = async (req: AuthRequest, res: Response) => {
  try {
    const { email, role } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const normalizedEmail = email.toLowerCase().trim();

    // Check if the target user is already a member
    const invitee = await User.findOne({ email: normalizedEmail });
    if (invitee) {
      const alreadyMember = project.members.some(
        (m: any) => m.user.toString() === invitee._id.toString()
      );
      if (alreadyMember) {
        return res.status(400).json({ message: 'This user is already a project member' });
      }
    }

    // Generate tokens
    const token = crypto.randomBytes(32).toString('hex');
    let code = generateShortCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Ensure the short code is unique (retry once on collision)
    const existingCode = await Invitation.findOne({ code, status: 'pending' });
    if (existingCode) code = generateShortCode();

    // Upsert: update existing pending invite or create a new one
    let invitation = await Invitation.findOne({ email: normalizedEmail, project: project._id, status: 'pending' });

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

    // Build URLs
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const acceptUrl = `${clientUrl}/invite/${token}`;
    const joinUrl = `${clientUrl}/join?code=${code}`;

    // Always send the invitation email
    await sendInviteEmail({
      to: normalizedEmail,
      inviterName: req.user.name,
      projectName: project.name,
      projectColor: project.color || '#6366f1',
      role: role || 'member',
      acceptUrl,
      joinCode: code,
    });

    // For registered users: also create an in-app notification
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

      const io = req.app.get('io');
      io.to(invitee._id.toString()).emit('notification:new', notification);
    }

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

// ─── GET PENDING INVITES ───────────────────────────────────────────────────────
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

// ─── GET INVITE INFO (public — no auth needed) ────────────────────────────────
export const getInviteInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token, status: 'pending' })
      .populate('project', 'name color description icon')
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

// ─── ACCEPT INVITE (by long token via link) ───────────────────────────────────
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

    // Email must match the logged-in user
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        message: `This invitation was sent to ${invitation.email}. Please log in with that account.`,
      });
    }

    const project = await Project.findById(invitation.project);
    if (!project) return res.status(404).json({ message: 'Project no longer exists' });

    const alreadyMember = project.members.some(
      (m: any) => m.user.toString() === user._id.toString()
    );
    if (!alreadyMember) {
      const permissions = getDefaultPermissions(invitation.role);
      project.members.push({ user: user._id as any, role: invitation.role, permissions, joinedAt: new Date() });
      await project.save();
      await User.findByIdAndUpdate(user._id, { $addToSet: { projects: project._id } });
    }

    invitation.status = 'accepted';
    await invitation.save();

    // Notify all admins/owner that someone joined
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

    res.json({ message: 'You have joined the project! 🎉', projectId: project._id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ACCEPT INVITE BY SHORT CODE ──────────────────────────────────────────────
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

    // Email must match
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        message: `This invite code was sent to ${invitation.email}. Please log in with that account.`,
      });
    }

    const project = await Project.findById(invitation.project);
    if (!project) return res.status(404).json({ message: 'Project no longer exists' });

    const alreadyMember = project.members.some(
      (m: any) => m.user.toString() === user._id.toString()
    );
    if (!alreadyMember) {
      const permissions = getDefaultPermissions(invitation.role);
      project.members.push({ user: user._id as any, role: invitation.role, permissions, joinedAt: new Date() });
      await project.save();
      await User.findByIdAndUpdate(user._id, { $addToSet: { projects: project._id } });
    }

    invitation.status = 'accepted';
    await invitation.save();

    res.json({ message: 'You have joined the project! 🎉', projectId: project._id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── JOIN WITH PROJECT CODE (project-wide, unlimited uses) ────────────────────
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
      (m: any) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({
        message: 'You are already a member of this project',
        projectId: project._id,
      });
    }

    const permissions = getDefaultPermissions('member');
    project.members.push({ user: req.user._id as any, role: 'member', permissions, joinedAt: new Date() });
    await project.save();
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { projects: project._id } });

    // Notify all admins/owner that someone joined
    const io = req.app.get('io');
    io.to(`project:${project._id}`).emit('project:member_joined', {
      userId: req.user._id,
      name: req.user.name,
      role: 'member',
    });
    await notifyProjectAdmins({
      project,
      excludeUserId: String(req.user._id),
      type: 'user_joined',
      title: `${req.user.name} joined ${project.name}`,
      message: `${req.user.name} joined via join code and is now a member.`,
      link: `/dashboard/projects/${project._id}/team`,
      io,
    });

    res.json({ message: 'Successfully joined the project', projectId: project._id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── MANAGE ROLES ─────────────────────────────────────────────────────────────
export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = (project.members as any[]).find((m) => m.user.toString() === userId);
    if (!member) return res.status(404).json({ message: 'Member not found in project' });

    if (String(project.owner) === userId) {
      return res.status(403).json({ message: "Cannot modify the project owner's role" });
    }

    if (role) member.role = role;
    if (permissions && Array.isArray(permissions)) member.permissions = permissions;

    await project.save();

    const io = req.app.get('io');
    io.to(`project:${project._id}`).emit('project:member_updated', member);

    res.json({ message: 'Member role/permissions updated', project });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.members = project.members.filter((m: any) => m.user.toString() !== userId) as any;
    await project.save();
    res.json({ message: 'Member removed', project });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
