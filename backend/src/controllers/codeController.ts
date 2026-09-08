import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { WorkspaceService } from '../services/workspaceService';
import { GitService } from '../services/gitService';
import { GitHubService } from '../services/githubService';
import { CodeAuditService } from '../services/codeAuditService';
import { getEffectiveCodePermission } from '../middleware/codeRbac';
import CodeWorkspace from '../models/CodeWorkspace';
import CodePermission from '../models/CodePermission';
import Project from '../models/Project';

// ─── Workspace & Filesystem Controllers ────────────────────────────────────────

export const getWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const workspace = await WorkspaceService.initWorkspace(projectId);
    const permission = await getEffectiveCodePermission(projectId, String(req.user._id), req.user.role);

    res.json({
      workspace,
      permission,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to load workspace' });
  }
};

export const getFileTree = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const tree = await WorkspaceService.getFileTree(projectId);
    res.json({ tree });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to load file tree' });
  }
};

export const readFile = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const filePath = req.query.path as string;

    if (!filePath) {
      return res.status(400).json({ message: 'File path parameter is required' });
    }

    const fileData = await WorkspaceService.readFile(projectId, filePath);
    res.json(fileData);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to read file' });
  }
};

export const writeFile = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { path: filePath, content } = req.body;

    if (!filePath || content === undefined) {
      return res.status(400).json({ message: 'File path and content are required' });
    }

    const result = await WorkspaceService.writeFile(projectId, filePath, content);

    // Audit log
    await CodeAuditService.logActivity({
      projectId,
      userId: String(req.user._id),
      file: filePath,
      action: 'modified',
      details: `${req.user.name} saved ${filePath}`,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to write file' });
  }
};

export const createFile = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { path: filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ message: 'File path is required' });
    }

    await WorkspaceService.createFile(projectId, filePath);

    await CodeAuditService.logActivity({
      projectId,
      userId: String(req.user._id),
      file: filePath,
      action: 'created',
      details: `${req.user.name} created file ${filePath}`,
    });

    res.json({ success: true, path: filePath });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create file' });
  }
};

export const createFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { path: folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ message: 'Folder path is required' });
    }

    await WorkspaceService.createFolder(projectId, folderPath);

    await CodeAuditService.logActivity({
      projectId,
      userId: String(req.user._id),
      file: folderPath,
      action: 'created',
      details: `${req.user.name} created folder ${folderPath}`,
    });

    res.json({ success: true, path: folderPath });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create folder' });
  }
};

export const renamePath = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { oldPath, newPath } = req.body;

    if (!oldPath || !newPath) {
      return res.status(400).json({ message: 'oldPath and newPath are required' });
    }

    await WorkspaceService.renamePath(projectId, oldPath, newPath);

    await CodeAuditService.logActivity({
      projectId,
      userId: String(req.user._id),
      file: newPath,
      action: 'renamed',
      details: `${req.user.name} renamed ${oldPath} to ${newPath}`,
      metadata: { oldPath, newPath },
    });

    res.json({ success: true, oldPath, newPath });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to rename path' });
  }
};

export const deletePath = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { path: targetPath } = req.body;

    if (!targetPath) {
      return res.status(400).json({ message: 'Target path is required' });
    }

    await WorkspaceService.deletePath(projectId, targetPath);

    await CodeAuditService.logActivity({
      projectId,
      userId: String(req.user._id),
      file: targetPath,
      action: 'deleted',
      details: `${req.user.name} deleted ${targetPath}`,
    });

    res.json({ success: true, path: targetPath });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to delete path' });
  }
};

export const duplicatePath = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { path: sourcePath } = req.body;

    if (!sourcePath) {
      return res.status(400).json({ message: 'Source path is required' });
    }

    const newPath = await WorkspaceService.duplicateFile(projectId, sourcePath);

    await CodeAuditService.logActivity({
      projectId,
      userId: String(req.user._id),
      file: newPath,
      action: 'created',
      details: `${req.user.name} duplicated ${sourcePath} as ${newPath}`,
    });

    res.json({ success: true, path: newPath });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to duplicate file' });
  }
};

export const searchFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const query = (req.query.q as string) || '';
    const caseSensitive = req.query.caseSensitive === 'true';
    const isRegex = req.query.isRegex === 'true';

    const results = await WorkspaceService.searchWorkspace(projectId, query, caseSensitive, isRegex);
    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Search failed' });
  }
};

// ─── Git Operations Controllers ───────────────────────────────────────────────

export const getGitStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const status = await GitService.getStatus(projectId);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to get Git status' });
  }
};

export const getGitDiff = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const filePath = req.query.file as string | undefined;
    const diff = await GitService.getDiff(projectId, filePath);
    res.json({ diff });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to generate diff' });
  }
};

export const commitChanges = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { message, files } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Commit message is required' });
    }

    const result = await GitService.commit(
      projectId,
      message,
      { name: req.user.name, email: req.user.email },
      files || []
    );

    await CodeAuditService.logActivity({
      projectId,
      userId: String(req.user._id),
      action: 'committed',
      details: `${req.user.name} committed: "${message}" (${result.commitHash.substring(0, 7)})`,
      metadata: { commitHash: result.commitHash, branch: result.branch },
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Commit failed' });
  }
};

export const getBranches = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const branches = await GitService.getBranches(projectId);
    res.json(branches);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to get branches' });
  }
};

export const switchOrCreateBranch = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { branch, create } = req.body;

    if (!branch) {
      return res.status(400).json({ message: 'Branch name is required' });
    }

    if (create) {
      await GitService.createBranch(projectId, branch, true);
      await CodeAuditService.logActivity({
        projectId,
        userId: String(req.user._id),
        action: 'branch_created',
        details: `${req.user.name} created and switched to branch "${branch}"`,
        metadata: { branch },
      });
    } else {
      await GitService.checkoutBranch(projectId, branch);
      await CodeAuditService.logActivity({
        projectId,
        userId: String(req.user._id),
        action: 'branch_switched',
        details: `${req.user.name} switched to branch "${branch}"`,
        metadata: { branch },
      });
    }

    res.json({ success: true, branch });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Branch operation failed' });
  }
};

export const gitPull = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const token = await GitHubService.getDecryptedToken(String(req.user._id));
    const result = await GitService.pull(projectId, token || undefined);

    await CodeAuditService.logActivity({
      projectId,
      userId: String(req.user._id),
      action: 'pulled',
      details: `${req.user.name} pulled latest changes on branch "${result.branch}"`,
      metadata: { branch: result.branch },
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Git pull failed' });
  }
};

export const gitPush = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { branch } = req.body;
    const token = await GitHubService.getDecryptedToken(String(req.user._id));

    const result = await GitService.push(projectId, token || undefined, branch);

    await CodeAuditService.logActivity({
      projectId,
      userId: String(req.user._id),
      action: 'pushed',
      details: `${req.user.name} pushed commits to origin/${result.branch}`,
      metadata: { branch: result.branch },
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Git push failed. Ensure remote branch is up to date.' });
  }
};

export const getGitHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;
    const history = await GitService.getHistory(projectId, limit);
    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to get commit history' });
  }
};

// ─── GitHub Integration Controllers ───────────────────────────────────────────

export const getGitHubStatus = async (req: AuthRequest, res: Response) => {
  try {
    const info = await GitHubService.getConnectionInfo(String(req.user._id));
    res.json({ connected: Boolean(info), info });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to get GitHub status' });
  }
};

export const getGitHubAuthUrl = async (req: AuthRequest, res: Response) => {
  try {
    const state = `sf_${req.user._id}_${Date.now()}`;
    const redirectUri = req.query.redirectUri as string | undefined;
    const url = GitHubService.getOAuthUrl(state, redirectUri);
    res.json({ url, state });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to generate auth URL' });
  }
};

export const handleGitHubCallback = async (req: AuthRequest, res: Response) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    const connection = await GitHubService.handleOAuthCallback(code, String(req.user._id), redirectUri);
    res.json({
      success: true,
      username: connection.username,
      displayName: connection.displayName,
      avatarUrl: connection.avatarUrl,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'GitHub authentication failed' });
  }
};

export const connectGitHubToken = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'GitHub personal access token is required' });
    }

    const connection = await GitHubService.saveUserToken(String(req.user._id), token);
    res.json({
      success: true,
      username: connection.username,
      displayName: connection.displayName,
      avatarUrl: connection.avatarUrl,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to connect GitHub token. Ensure token is valid.' });
  }
};

export const disconnectGitHub = async (req: AuthRequest, res: Response) => {
  try {
    await GitHubService.disconnect(String(req.user._id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to disconnect GitHub' });
  }
};

export const listGitHubRepos = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const search = req.query.search as string | undefined;
    const result = await GitHubService.getUserRepositories(String(req.user._id), page, 50, search);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch repositories' });
  }
};

export const cloneGitHubRepo = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { repoUrl, repoName, owner, isPrivate, defaultBranch } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ message: 'Repository clone URL is required' });
    }

    const token = await GitHubService.getDecryptedToken(String(req.user._id));
    const cloneResult = await GitService.cloneRepository(projectId, repoUrl, token || undefined);

    await CodeWorkspace.findOneAndUpdate(
      { project: projectId },
      {
        repository: {
          url: repoUrl,
          name: repoName || repoUrl.split('/').pop()?.replace('.git', '') || 'repository',
          owner: owner || 'unknown',
          isPrivate: Boolean(isPrivate),
          defaultBranch: cloneResult.defaultBranch || defaultBranch || 'main',
          cloneUrl: repoUrl,
          connectedBy: req.user._id,
          connectedAt: new Date(),
        },
        currentBranch: cloneResult.defaultBranch,
        defaultBranch: cloneResult.defaultBranch,
        lastSyncedAt: new Date(),
      },
      { upsert: true }
    );

    await CodeAuditService.logActivity({
      projectId,
      userId: String(req.user._id),
      action: 'created',
      details: `${req.user.name} connected and cloned repository ${repoUrl}`,
    });

    res.json({ success: true, branch: cloneResult.defaultBranch });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to clone repository' });
  }
};

// ─── Code Permissions & Audit Controllers ─────────────────────────────────────

export const getCodePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId)
      .populate('members.user', 'name email avatar role')
      .populate('owner', 'name email avatar role')
      .lean();

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const overrides = await CodePermission.find({ project: projectId }).lean();
    const overrideMap = new Map(overrides.map((o) => [String(o.user), o.permission]));

    const membersList = (project.members || []).map((m: any) => {
      const u = m.user;
      const uId = String(u?._id || u);
      const isOwner = String(project.owner?._id || project.owner) === uId;
      let effectivePerm = overrideMap.get(uId);

      if (!effectivePerm) {
        if (isOwner || m.role === 'admin' || m.permissions?.includes('manage')) {
          effectivePerm = 'WRITE';
        } else if (m.role === 'viewer') {
          effectivePerm = 'VIEW';
        } else {
          effectivePerm = 'EDIT';
        }
      }

      return {
        userId: uId,
        name: u?.name || 'Member',
        email: u?.email || '',
        avatar: u?.avatar || '',
        role: m.role || 'member',
        isOwner,
        codePermission: effectivePerm,
      };
    });

    res.json({ members: membersList });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to get code permissions' });
  }
};

export const updateCodePermission = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, userId } = req.params;
    const { permission } = req.body;

    if (!['VIEW', 'EDIT', 'WRITE'].includes(permission)) {
      return res.status(400).json({ message: 'Invalid permission. Must be VIEW, EDIT, or WRITE.' });
    }

    const permDoc = await CodePermission.findOneAndUpdate(
      { project: projectId, user: userId },
      { permission, grantedBy: req.user._id },
      { upsert: true, new: true }
    );

    res.json({ success: true, permission: permDoc.permission });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update code permission' });
  }
};

export const getCodeActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const file = req.query.file as string | undefined;
    const action = req.query.action as string | undefined;
    const userId = req.query.userId as string | undefined;
    const page = parseInt(req.query.page as string) || 1;

    const activity = await CodeAuditService.getActivity(projectId, {
      file,
      action,
      userId,
      page,
      limit: 40,
    });

    res.json(activity);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to get code activity' });
  }
};

export const getFileVersions = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const file = req.query.file as string;

    if (!file) {
      return res.status(400).json({ message: 'File parameter is required' });
    }

    const versions = await CodeAuditService.getFileVersions(projectId, file);
    res.json({ versions });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to get file versions' });
  }
};

export const getVersionById = async (req: AuthRequest, res: Response) => {
  try {
    const { versionId } = req.params;
    const version = await CodeAuditService.getVersionById(versionId);
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }
    res.json(version);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to get version' });
  }
};
