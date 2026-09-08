import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from './auth';
import Project from '../models/Project';
import CodePermission, { CodePermissionLevel } from '../models/CodePermission';

const PERMISSION_WEIGHT: Record<CodePermissionLevel, number> = {
  VIEW: 1,
  EDIT: 2,
  WRITE: 3,
};

/**
 * Resolves the effective Code permission level for a given user in a project.
 */
export const getEffectiveCodePermission = async (
  projectId: string,
  userId: string,
  userGlobalRole: string = 'member'
): Promise<CodePermissionLevel | null> => {
  if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  const project = await Project.findById(projectId).select('owner members isPrivate').lean();
  if (!project) return null;

  // Project owner always has full WRITE access
  if (String(project.owner) === String(userId)) {
    return 'WRITE';
  }

  // Check explicit CodePermission override
  const explicit = await CodePermission.findOne({ project: projectId, user: userId }).lean();
  if (explicit) {
    return explicit.permission;
  }

  // Check project membership
  const member = (project.members as any[] || []).find(
    (m) => String(m.user?._id || m.user || m) === String(userId)
  );

  if (!member) {
    // If not a member, but project is not private and user is global admin
    if (userGlobalRole === 'admin') return 'WRITE';
    return null;
  }

  const role = (member.role || '').toLowerCase();
  if (role === 'admin') return 'WRITE';
  if (role === 'viewer') return 'VIEW';
  if (member.permissions?.includes('manage')) return 'WRITE';
  if (member.permissions?.includes('edit') || member.permissions?.includes('create')) return 'EDIT';

  return 'EDIT';
};

/**
 * Express middleware requiring a minimum Code permission level ('VIEW' | 'EDIT' | 'WRITE').
 */
export const requireCodePermission = (requiredLevel: CodePermissionLevel) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const projectId =
        req.params.projectId ||
        req.params.id ||
        (req.query.projectId as string) ||
        req.body.projectId;

      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      if (!req.user?._id) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const effectiveLevel = await getEffectiveCodePermission(
        projectId,
        String(req.user._id),
        req.user.role
      );

      if (!effectiveLevel) {
        return res.status(403).json({
          message: 'Access denied: You are not a member of this project workspace',
          code: 'CODE_ACCESS_DENIED',
        });
      }

      const userWeight = PERMISSION_WEIGHT[effectiveLevel];
      const requiredWeight = PERMISSION_WEIGHT[requiredLevel];

      if (userWeight < requiredWeight) {
        return res.status(403).json({
          message: `Action requires '${requiredLevel}' permission. Your current level is '${effectiveLevel}'.`,
          code: 'INSUFFICIENT_CODE_PERMISSION',
          currentLevel: effectiveLevel,
          requiredLevel,
        });
      }

      (req as any).codePermission = effectiveLevel;
      next();
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Permission check failed' });
    }
  };
};
