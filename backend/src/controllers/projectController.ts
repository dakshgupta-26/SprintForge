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

// Default permissions mapping for standard roles
const getDefaultPermissions = (roleName: string): any[] => {
  const r = roleName.toLowerCase();
  if (r === 'admin') return ['view', 'create', 'edit', 'delete', 'manage'];
  if (r === 'viewer') return ['view'];
  return ['view', 'create', 'edit']; // Default for member, developers, etc.
};

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
    // RBAC handles permission via requirePermission('manage')

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
      return res.status(403).json({ message: 'Only project owner can delete' });
    }
    await Task.deleteMany({ project: req.params.id });
    await Sprint.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    // Check if user exists in the system
    const invitee = await User.findOne({ email });
    
    if (invitee) {
      const alreadyMember = project.members.some((m: any) => m.user.toString() === invitee._id.toString());
      if (alreadyMember) return res.status(400).json({ message: 'User is already a project member' });
      
      const permissions = getDefaultPermissions(role || 'member');
      
      project.members.push({ user: invitee._id as any, role: role || 'member', permissions, joinedAt: new Date() });
      await project.save();
      await User.findByIdAndUpdate(invitee._id, { $push: { projects: project._id } });
      
      // In-App Notification
      const notification = await Notification.create({
        recipient: invitee._id,
        sender: req.user._id,
        type: 'project_invite',
        title: 'Project Invitation',
        message: `${req.user.name} added you directly to ${project.name}`,
        data: { projectId: project._id },
        link: `/dashboard/projects/${project._id}/board`
      });

      // Emit Socket to user
      const io = req.app.get('io');
      io.to(invitee._id.toString()).emit('notification:new', notification);
      
      return res.json({ message: 'User was directly added to the project', project });
    }

    // User doesn't exist -> generate a pending invite
    // 1. Check if pending invite already exists
    let invitation = await Invitation.findOne({ email, project: project._id, status: 'pending' });
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
    
    if (invitation) {
      // Update existing invite
      invitation.token = token;
      invitation.expiresAt = expiresAt;
      invitation.role = role || 'member';
      await invitation.save();
    } else {
      // Create new invite
      invitation = await Invitation.create({
        email,
        project: project._id,
        inviter: req.user._id,
        role: role || 'member',
        token,
        expiresAt
      });
    }

    // Send Email
    const acceptUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/invite/${token}`;
    await sendInviteEmail({
       to: email,
       inviterName: req.user.name,
       projectName: project.name,
       projectColor: project.color || '#6366f1',
       role: role || 'member',
       acceptUrl
    });

    res.json({ message: 'Invitation email sent successfully', invitation });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectInvites = async (req: AuthRequest, res: Response) => {
  try {
    const invites = await Invitation.find({ project: req.params.id, status: 'pending' })
      .populate('inviter', 'name avatar email');
    res.json(invites);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

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

export const acceptInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;
    const user = req.user; // User must be logged in to accept
    
    const invitation = await Invitation.findOne({ token, status: 'pending' });
    if (!invitation) return res.status(404).json({ message: 'Invalid or expired invitation' });
    
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }
    
    // Optionally ensure user.email === invitation.email (for security)
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
       return res.status(403).json({ message: 'This invitation was sent to a different email address.' });
    }

    const project = await Project.findById(invitation.project);
    if (!project) return res.status(404).json({ message: 'Project no longer exists' });

    // Check if already a member
    const alreadyMember = project.members.some((m: any) => m.user.toString() === user._id.toString());
    if (!alreadyMember) {
      const permissions = getDefaultPermissions(invitation.role);
      project.members.push({ user: user._id as any, role: invitation.role, permissions, joinedAt: new Date() });
      await project.save();
      await User.findByIdAndUpdate(user._id, { $addToSet: { projects: project._id } });
    }

    // Mark as accepted
    invitation.status = 'accepted';
    await invitation.save();

    res.json({ message: 'Invitation accepted successfully', projectId: project._id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── NEW: Join With Code ───

export const generateJoinCode = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    // Generate an alphanumeric 6-character code
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

    const alreadyMember = project.members.some((m: any) => m.user.toString() === req.user._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ message: 'You are already a member of this project', projectId: project._id });
    }

    const permissions = getDefaultPermissions('member');
    project.members.push({ user: req.user._id as any, role: 'member', permissions, joinedAt: new Date() });
    await project.save();
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { projects: project._id } });

    // Emit live update
    const io = req.app.get('io');
    io.to(`project:${project._id}`).emit('project:member_joined', { userId: req.user._id, name: req.user.name, role: 'member' });

    res.json({ message: 'Successfully joined the project', projectId: project._id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── NEW: Manage Roles ───

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = (project.members as any[]).find((m) => m.user.toString() === userId);
    if (!member) return res.status(404).json({ message: 'Member not found in project' });

    // Prevent modifying owner's role if we wanted to, but we skip it here
    if (String(project.owner) === userId) {
      return res.status(403).json({ message: 'Cannot modify project owner\'s role' });
    }

    if (role) member.role = role;
    if (permissions && Array.isArray(permissions)) member.permissions = permissions;

    await project.save();

    // Emit to room that role changed
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
