import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { ImpactService } from '../services/impact/impactService';
import Project from '../models/Project';

const router = Router({ mergeParams: true });

router.use(protect);

/**
 * Helper: verify user has read access to the project
 */
async function verifyProjectAccess(projectId: string, userId: string): Promise<boolean> {
  const project = await Project.findById(projectId).select('owner members isPrivate').lean();
  if (!project) return false;

  const isOwner = String(project.owner) === String(userId);
  const isMember = (project.members as any[]).some((m) => String(m.user?._id || m.user || m) === String(userId));

  if (!isOwner && !isMember && project.isPrivate) {
    return false;
  }
  return true;
}

/**
 * GET /api/projects/:projectId/impact
 * Returns complete impact analysis for the project or sprint.
 */
router.get('/:projectId/impact', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { sprintId } = req.query;
    const userId = (req as any).user?._id;

    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      res.status(403).json({ message: 'You do not have access to this project workspace' });
      return;
    }

    const analysis = await ImpactService.getProjectImpact(
      projectId,
      typeof sprintId === 'string' ? sprintId : undefined
    );

    res.json(analysis);
  } catch (err: any) {
    console.error('Impact analysis error:', err);
    res.status(500).json({ message: err?.message || 'Failed to calculate impact analysis' });
  }
});

/**
 * POST /api/projects/:projectId/impact/simulate
 * Runs an in-memory What-If scenario simulation without mutating any data.
 */
router.post('/:projectId/impact/simulate', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { sprintId, scenario } = req.body;
    const userId = (req as any).user?._id;

    if (!scenario || !scenario.taskId) {
      res.status(400).json({ message: 'Simulation scenario must include a valid taskId' });
      return;
    }

    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      res.status(403).json({ message: 'You do not have access to this project workspace' });
      return;
    }

    const result = await ImpactService.simulateChange(
      projectId,
      scenario,
      typeof sprintId === 'string' ? sprintId : undefined
    );

    res.json(result);
  } catch (err: any) {
    console.error('Simulation error:', err);
    res.status(500).json({ message: err?.message || 'Failed to simulate scenario' });
  }
});

/**
 * GET /api/projects/:projectId/impact/tasks/:taskId
 * Returns single task blast radius and upstream blockers.
 */
router.get('/:projectId/impact/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = (req as any).user?._id;

    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      res.status(403).json({ message: 'You do not have access to this project workspace' });
      return;
    }

    const taskImpact = await ImpactService.getTaskImpact(taskId);
    res.json(taskImpact);
  } catch (err: any) {
    console.error('Task impact error:', err);
    res.status(500).json({ message: err?.message || 'Failed to get task impact' });
  }
});

export default router;
