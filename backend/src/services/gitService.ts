import simpleGit, { SimpleGit, StatusResult } from 'simple-git';
import fs from 'fs';
import path from 'path';
import { WorkspaceService } from './workspaceService';
import CodeWorkspace from '../models/CodeWorkspace';

export interface GitFileStatus {
  path: string;
  status: 'M' | 'A' | 'D' | 'U' | 'R' | 'C' | '?';
  staged: boolean;
}

export interface GitStatusSummary {
  branch: string;
  ahead: number;
  behind: number;
  isClean: boolean;
  files: GitFileStatus[];
  tracking?: string;
}

export interface GitCommitItem {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

export class GitService {
  /**
   * Initializes or gets the SimpleGit instance for a given project workspace directory.
   */
  public static getGit(projectId: string): SimpleGit {
    const root = WorkspaceService.getWorkspaceRoot(projectId);
    return simpleGit(root);
  }

  /**
   * Checks if the project workspace is an initialized Git repository.
   */
  public static async isGitRepo(projectId: string): Promise<boolean> {
    const root = WorkspaceService.getWorkspaceRoot(projectId);
    const gitDir = path.join(root, '.git');
    if (!fs.existsSync(gitDir)) return false;

    try {
      const git = this.getGit(projectId);
      return await git.checkIsRepo();
    } catch {
      return false;
    }
  }

  /**
   * Initializes a Git repository in the workspace if not already present.
   */
  public static async initRepo(projectId: string, defaultBranch: string = 'main'): Promise<boolean> {
    const isRepo = await this.isGitRepo(projectId);
    if (!isRepo) {
      const git = this.getGit(projectId);
      await git.init(['-b', defaultBranch]);

      // Set workspace default author if not configured
      try {
        await git.addConfig('user.name', 'SprintForge Developer', false, 'local');
        await git.addConfig('user.email', 'developer@sprintforge.io', false, 'local');
      } catch {}

      // Initial commit if there are files
      try {
        await git.add('.');
        await git.commit('Initial workspace commit');
      } catch {}
    }
    return true;
  }

  /**
   * Retrieves the detailed Git status of the project workspace.
   */
  public static async getStatus(projectId: string): Promise<GitStatusSummary> {
    const isRepo = await this.isGitRepo(projectId);
    if (!isRepo) {
      await this.initRepo(projectId);
    }

    const git = this.getGit(projectId);
    const status: StatusResult = await git.status();

    const files: GitFileStatus[] = [];

    // 1. Modified
    status.modified.forEach((f) => {
      files.push({ path: f, status: 'M', staged: false });
    });

    // 2. Created / Added
    status.created.forEach((f) => {
      files.push({ path: f, status: 'A', staged: true });
    });

    // 3. Deleted
    status.deleted.forEach((f) => {
      files.push({ path: f, status: 'D', staged: false });
    });

    // 4. Renamed
    status.renamed.forEach((f) => {
      files.push({ path: f.to, status: 'R', staged: true });
    });

    // 5. Untracked
    status.not_added.forEach((f) => {
      files.push({ path: f, status: 'U', staged: false });
    });

    // 6. Staged changes
    status.staged.forEach((f) => {
      const existing = files.find((item) => item.path === f);
      if (existing) {
        existing.staged = true;
      } else {
        files.push({ path: f, status: 'M', staged: true });
      }
    });

    return {
      branch: status.current || 'main',
      ahead: status.ahead,
      behind: status.behind,
      isClean: status.isClean(),
      files,
      tracking: status.tracking || undefined,
    };
  }

  /**
   * Generates a unified diff for a specific file or the whole working directory.
   */
  public static async getDiff(projectId: string, filePath?: string): Promise<string> {
    const isRepo = await this.isGitRepo(projectId);
    if (!isRepo) return '';

    const git = this.getGit(projectId);
    try {
      if (filePath) {
        // Try getting diff against HEAD
        const diff = await git.diff(['HEAD', '--', filePath]);
        if (diff) return diff;

        // If file is untracked, produce diff from empty file
        const absPath = WorkspaceService.resolveSafePath(projectId, filePath);
        if (fs.existsSync(absPath)) {
          const content = fs.readFileSync(absPath, 'utf-8');
          return `--- /dev/null\n+++ b/${filePath}\n@@ -0,0 +1,${content.split('\n').length} @@\n${content
            .split('\n')
            .map((line) => `+${line}`)
            .join('\n')}`;
        }
        return '';
      }
      return await git.diff(['HEAD']);
    } catch {
      return '';
    }
  }

  /**
   * Stages files and creates a Git commit.
   */
  public static async commit(
    projectId: string,
    message: string,
    author?: { name: string; email: string },
    filesToStage: string[] = []
  ): Promise<{ commitHash: string; branch: string }> {
    if (!message || message.trim().length === 0) {
      throw new Error('Commit message is required');
    }

    const isRepo = await this.isGitRepo(projectId);
    if (!isRepo) {
      await this.initRepo(projectId);
    }

    const git = this.getGit(projectId);

    // If specific files provided, stage them; otherwise stage everything (git add -A)
    if (filesToStage.length > 0) {
      await git.add(filesToStage);
    } else {
      await git.add('-A');
    }

    const authorStr = author ? `${author.name} <${author.email}>` : undefined;
    const commitResult = await git.commit(message, undefined, authorStr ? { '--author': authorStr } : undefined);

    const status = await git.status();
    const branch = status.current || 'main';

    // Update workspace model
    await CodeWorkspace.findOneAndUpdate(
      { project: projectId },
      { currentBranch: branch, updatedAt: new Date() }
    );

    return {
      commitHash: commitResult.commit || 'HEAD',
      branch,
    };
  }

  /**
   * Retrieves branch listing (local and remote).
   */
  public static async getBranches(
    projectId: string
  ): Promise<{ current: string; all: string[]; branches: Record<string, any> }> {
    const isRepo = await this.isGitRepo(projectId);
    if (!isRepo) {
      await this.initRepo(projectId);
    }

    const git = this.getGit(projectId);
    const branchSummary = await git.branch();

    return {
      current: branchSummary.current,
      all: branchSummary.all,
      branches: branchSummary.branches,
    };
  }

  /**
   * Creates a new branch and optionally checks it out.
   */
  public static async createBranch(
    projectId: string,
    branchName: string,
    checkout: boolean = true
  ): Promise<boolean> {
    if (!branchName || !/^[a-zA-Z0-9_\-./]+$/.test(branchName)) {
      throw new Error('Invalid branch name. Only letters, numbers, hyphens, and slashes are allowed.');
    }

    const isRepo = await this.isGitRepo(projectId);
    if (!isRepo) {
      await this.initRepo(projectId);
    }

    const git = this.getGit(projectId);
    if (checkout) {
      await git.checkoutLocalBranch(branchName);
      await CodeWorkspace.findOneAndUpdate({ project: projectId }, { currentBranch: branchName });
    } else {
      await git.branch([branchName]);
    }
    return true;
  }

  /**
   * Switches to an existing branch.
   */
  public static async checkoutBranch(projectId: string, branchName: string): Promise<boolean> {
    const isRepo = await this.isGitRepo(projectId);
    if (!isRepo) throw new Error('Git repository not initialized');

    const git = this.getGit(projectId);
    await git.checkout(branchName);

    await CodeWorkspace.findOneAndUpdate({ project: projectId }, { currentBranch: branchName });
    return true;
  }

  /**
   * Clones a repository (public or authenticated private) into the project workspace directory.
   */
  public static async cloneRepository(
    projectId: string,
    repoUrl: string,
    authToken?: string
  ): Promise<{ defaultBranch: string; remoteName: string }> {
    const root = WorkspaceService.getWorkspaceRoot(projectId);

    // Clean directory before cloning
    const existing = fs.readdirSync(root);
    for (const item of existing) {
      const itemPath = path.join(root, item);
      fs.rmSync(itemPath, { recursive: true, force: true });
    }

    // Embed token in clone URL safely if private token provided
    let authenticatedUrl = repoUrl;
    if (authToken && repoUrl.startsWith('https://')) {
      const cleanedUrl = repoUrl.replace(/^https:\/\//, '');
      authenticatedUrl = `https://x-access-token:${authToken}@${cleanedUrl}`;
    }

    const git = simpleGit();
    await git.clone(authenticatedUrl, root);

    const projectGit = this.getGit(projectId);
    const status = await projectGit.status();
    const defaultBranch = status.current || 'main';

    await CodeWorkspace.findOneAndUpdate(
      { project: projectId },
      {
        currentBranch: defaultBranch,
        defaultBranch,
        lastSyncedAt: new Date(),
      },
      { upsert: true }
    );

    return {
      defaultBranch,
      remoteName: 'origin',
    };
  }

  /**
   * Pulls changes from remote origin for current branch.
   */
  public static async pull(
    projectId: string,
    authToken?: string
  ): Promise<{ summary: any; branch: string }> {
    const git = this.getGit(projectId);
    const status = await git.status();
    const branch = status.current || 'main';

    if (authToken) {
      const remotes = await git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin');
      if (origin && origin.refs.fetch.startsWith('https://')) {
        const cleaned = origin.refs.fetch.replace(/^https:\/\/(.*@)?/, '');
        const authed = `https://x-access-token:${authToken}@${cleaned}`;
        await git.remote(['set-url', 'origin', authed]);
      }
    }

    const pullResult = await git.pull('origin', branch);

    await CodeWorkspace.findOneAndUpdate(
      { project: projectId },
      { lastSyncedAt: new Date() }
    );

    return {
      summary: pullResult.summary,
      branch,
    };
  }

  /**
   * Pushes current branch commits to remote origin.
   */
  public static async push(
    projectId: string,
    authToken?: string,
    targetBranch?: string
  ): Promise<{ success: boolean; branch: string }> {
    const git = this.getGit(projectId);
    const status = await git.status();
    const branch = targetBranch || status.current || 'main';

    if (authToken) {
      const remotes = await git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin');
      if (origin && origin.refs.push.startsWith('https://')) {
        const cleaned = origin.refs.push.replace(/^https:\/\/(.*@)?/, '');
        const authed = `https://x-access-token:${authToken}@${cleaned}`;
        await git.remote(['set-url', 'origin', authed]);
      }
    }

    await git.push('origin', branch, ['--set-upstream']);

    await CodeWorkspace.findOneAndUpdate(
      { project: projectId },
      { lastSyncedAt: new Date() }
    );

    return {
      success: true,
      branch,
    };
  }

  /**
   * Retrieves the commit history log.
   */
  public static async getHistory(
    projectId: string,
    limit: number = 30
  ): Promise<GitCommitItem[]> {
    const isRepo = await this.isGitRepo(projectId);
    if (!isRepo) return [];

    const git = this.getGit(projectId);
    try {
      const log = await git.log({ maxCount: limit });
      return log.all.map((entry) => ({
        hash: entry.hash,
        shortHash: entry.hash.substring(0, 7),
        author: entry.author_name,
        email: entry.author_email,
        date: entry.date,
        message: entry.message,
      }));
    } catch {
      return [];
    }
  }
}
