import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from './auth';
import Project from '../models/Project';
import Task from '../models/Task';
import Sprint from '../models/Sprint';
import Wiki from '../models/Wiki';

type Permission = 'view' | 'create' | 'edit' | 'delete' | 'manage';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin:  ['view', 'create', 'edit', 'delete', 'manage'],
  member: ['view', 'create', 'edit'],
  viewer: ['view'],
};

/**
 * Resolves the project ID from various request locations.
 * For task routes (/:id), we must look up the task to find its project.
 */
const resolveProjectId = async (req: AuthRequest): Promise<string | null> => {
  // Directly in body (create task)
  if (req.body?.project) return req.body.project;
  // In query (get tasks with ?project=)
  if (req.query?.project) return req.query.project as string;
  // Project route param
  if (req.params?.projectId) return req.params.projectId;
  
  // Specific routes
  if (req.params?.id) {
    if (req.baseUrl.includes('projects')) {
      return req.params.id;
    }
    if (req.baseUrl.includes('tasks')) {
      const task = await Task.findById(req.params.id).select('project').lean();
      if (task) return String(task.project);
    }
    if (req.baseUrl.includes('sprints')) {
      const sprint = await Sprint.findById(req.params.id).select('project').lean();
      if (sprint) return String(sprint.project);
    }
    if (req.baseUrl.includes('wiki')) {
      const wiki = await Wiki.findById(req.params.id).select('project').lean();
      if (wiki) return String(wiki.project);
    }
  }
  return null;
};

export const requirePermission = (permission: Permission) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = await resolveProjectId(req);
      if (!projectId) return next(); // no project context — let controller handle it

      // Validate projectId is a valid ObjectId before querying
      if (!mongoose.Types.ObjectId.isValid(projectId)) return next();

      const project = await Project.findById(projectId).lean();
      if (!project) return res.status(404).json({ message: 'Project not found' });

      // ── Owner always has full access ──────────────────────────────────────────
      if (String(project.owner) === String(req.user._id)) {
        (req as any).project = project;
        return next();
      }

      // ── Find the member entry ─────────────────────────────────────────────────
      const member = (project.members as any[]).find(
        (m) => String(m.user?._id || m.user) === String(req.user._id)
      );

      if (!member) {
        return res.status(403).json({ message: 'You are not a member of this project' });
      }

      (req as any).project = project;
      (req as any).projectMember = member;

      // ── Resolve effective permissions ─────────────────────────────────────────
      // Normalize role to lowercase to handle 'Admin', 'ADMIN', 'admin', etc.
      const role = (member.role || '').toLowerCase();

      // If role is admin, always grant full access regardless of stored permissions
      if (role === 'admin' || role === 'owner') {
        return next();
      }

      // Build allowed list: prefer stored permissions, fall back to role defaults
      let allowed: Permission[] = [];

      if (member.permissions && member.permissions.length > 0) {
        allowed = member.permissions as Permission[];
      } else {
        // Role-based fallback for members whose permissions weren't stored
        if (role === 'member' || role === 'developer') {
          allowed = ['view', 'create', 'edit'];
        } else if (role === 'viewer') {
          allowed = ['view'];
        }
      }

      if (!allowed.includes(permission)) {
        return res.status(403).json({
          message: `Your role does not have '${permission}' permission`,
        });
      }

      next();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };
};

/**
 * Strict IDOR check: Verifies requesting user is a member or the owner of the project.
 */
export const requireProjectMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = await resolveProjectId(req);
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Valid project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userIdStr = String(req.user._id);
    const isOwner = String(project.owner) === userIdStr;
    const member = (project.members as any[]).find(
      (m) => String(m.user?._id || m.user) === userIdStr
    );

    if (!isOwner && !member && project.isPrivate) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    (req as any).project = project;
    (req as any).isOwner = isOwner;
    (req as any).projectMember = member;
    next();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Strict IDOR & Role check: Only the verified project OWNER can access.
 * Admins and normal members are strictly forbidden with 403.
 */
export const requireProjectOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = await resolveProjectId(req);
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Valid project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: Only the project owner can perform this action' });
    }

    (req as any).project = project;
    (req as any).isOwner = true;
    next();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Strict Role check: OWNER or ADMIN (if owner has allowed admin management).
 */
export const requireProjectAdminOrOwner = (action: 'editProject' | 'manageMembers' = 'editProject') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = await resolveProjectId(req);
      if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Valid project ID is required' });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const userIdStr = String(req.user._id);
      const isOwner = String(project.owner) === userIdStr;

      if (isOwner) {
        (req as any).project = project;
        (req as any).isOwner = true;
        return next();
      }

      const member = (project.members as any[]).find(
        (m) => String(m.user?._id || m.user) === userIdStr
      );

      if (!member) {
        return res.status(403).json({ message: 'You are not a member of this project' });
      }

      const role = (member.role || '').toLowerCase();
      if (role !== 'admin') {
        return res.status(403).json({ message: 'Only project owners and administrators can perform this action' });
      }

      // Check owner-controlled permission flags
      if (action === 'editProject' && project.settings?.allowAdminProjectEdit === false) {
        return res.status(403).json({ message: 'Project editing has been restricted to the project owner' });
      }

      if (action === 'manageMembers' && project.settings?.allowAdminMemberManagement === false) {
        return res.status(403).json({ message: 'Member management has been restricted to the project owner' });
      }

      (req as any).project = project;
      (req as any).isOwner = false;
      (req as any).projectMember = member;
      next();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };
};


