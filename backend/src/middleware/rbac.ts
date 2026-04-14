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
      if (!projectId) return next(); // no project context

      const project = await Project.findById(projectId).lean();
      if (!project) return res.status(404).json({ message: 'Project not found' });

      // Project owner always has full access
      if (String(project.owner) === String(req.user._id)) {
        return next();
      }

      const member = (project.members as any[]).find(
        (m) => String(m.user) === String(req.user._id)
      );

      if (!member) {
        return res.status(403).json({ message: 'You are not a member of this project' });
      }

      // Check the new granular permissions array
      const allowed: Permission[] = member.permissions || [];
      
      // Fallbacks in case older member objects haven't been migrated
      if (allowed.length === 0 && member.role) {
        if (member.role === 'admin') allowed.push('view', 'create', 'edit', 'delete', 'manage');
        if (member.role === 'member') allowed.push('view', 'create', 'edit');
        if (member.role === 'viewer') allowed.push('view');
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
