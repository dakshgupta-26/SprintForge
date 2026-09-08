import axios from 'axios';
import crypto from 'crypto';
import GitHubConnection, { IGitHubConnection } from '../models/GitHubConnection';
import { encryptMessage, decryptMessage } from '../utils/crypto';

export interface GitHubRepoItem {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  avatarUrl: string;
  isPrivate: boolean;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  description: string;
  updatedAt: string;
  stargazersCount: number;
  language: string;
}

export class GitHubService {
  public static get clientId(): string {
    return process.env.GITHUB_CLIENT_ID || '';
  }

  public static get clientSecret(): string {
    return process.env.GITHUB_CLIENT_SECRET || '';
  }

  public static get appSlug(): string {
    return process.env.GITHUB_APP_SLUG || '';
  }

  public static get callbackUrl(): string {
    return process.env.GITHUB_CALLBACK_URL || '';
  }

  public static get webhookSecret(): string {
    return process.env.GITHUB_WEBHOOK_SECRET || '';
  }

  /**
   * Checks if GitHub OAuth or GitHub App credentials are configured on the server.
   */
  public static isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /**
   * Returns GitHub App Installation URL where users can grant access to repositories.
   */
  public static getInstallationUrl(): string {
    if (this.appSlug) {
      return `https://github.com/apps/${this.appSlug}/installations/new`;
    }
    return 'https://github.com/settings/installations';
  }

  /**
   * Generates GitHub OAuth authorization URL with state CSRF protection.
   */
  public static getOAuthUrl(state: string, redirectUri?: string): string {
    const effectiveRedirect = redirectUri || this.callbackUrl || undefined;
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: 'repo read:user user:email',
      state,
      ...(effectiveRedirect ? { redirect_uri: effectiveRedirect } : {}),
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Handles OAuth code exchange and securely stores the encrypted access token.
   */
  public static async handleOAuthCallback(
    code: string,
    userId: string,
    redirectUri?: string
  ): Promise<IGitHubConnection> {
    const effectiveRedirect = redirectUri || this.callbackUrl || undefined;
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        ...(effectiveRedirect ? { redirect_uri: effectiveRedirect } : {}),
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const { access_token, scope } = tokenRes.data;
    if (!access_token) {
      throw new Error(tokenRes.data.error_description || 'Failed to obtain access token from GitHub');
    }

    return await this.saveUserToken(
      userId,
      access_token,
      scope ? scope.split(',') : ['repo', 'read:user']
    );
  }

  /**
   * Connects a user account directly with an access token / PAT (useful for self-hosted / local dev).
   */
  public static async saveUserToken(
    userId: string,
    accessToken: string,
    scopes: string[] = ['repo'],
    installationId?: string
  ): Promise<IGitHubConnection> {
    // Verify token and fetch user profile from GitHub API
    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const ghUser = userRes.data;
    const { encryptedData, iv } = encryptMessage(accessToken);

    const repositoryCount =
      (ghUser.public_repos || 0) +
      (ghUser.total_private_repos || 0) +
      (ghUser.owned_private_repos || 0);

    const connection = await GitHubConnection.findOneAndUpdate(
      { user: userId },
      {
        githubUserId: String(ghUser.id),
        username: ghUser.login,
        displayName: ghUser.name || ghUser.login,
        avatarUrl: ghUser.avatar_url,
        profileUrl: ghUser.html_url,
        encryptedAccessToken: encryptedData,
        iv,
        scopes,
        installationId: installationId || undefined,
        accountType: ghUser.type === 'Organization' ? 'Organization' : 'User',
        repositoryCount,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return connection;
  }

  /**
   * Retrieves connection state for user without exposing decrypted token.
   */
  public static async getConnectionInfo(userId: string): Promise<any> {
    const conn = await GitHubConnection.findOne({ user: userId }).lean();
    if (!conn) return null;

    return {
      connected: true,
      username: conn.username,
      displayName: conn.displayName,
      avatarUrl: conn.avatarUrl,
      profileUrl: conn.profileUrl,
      scopes: conn.scopes,
      installationId: conn.installationId,
      accountType: conn.accountType || 'User',
      repositoryCount: conn.repositoryCount || 0,
      installationUrl: this.getInstallationUrl(),
      connectedAt: conn.connectedAt,
      lastSyncedAt: conn.lastSyncedAt,
    };
  }

  /**
   * Internal helper: safely decrypts user's stored GitHub access token.
   */
  public static async getDecryptedToken(userId: string): Promise<string | null> {
    const conn = await GitHubConnection.findOne({ user: userId });
    if (!conn) return null;

    try {
      return decryptMessage(conn.encryptedAccessToken, conn.iv);
    } catch {
      return null;
    }
  }

  /**
   * Verifies access to a specific repository (public or private).
   */
  public static async verifyRepoAccess(
    userId: string,
    owner: string,
    repo: string
  ): Promise<{ hasAccess: boolean; isPrivate?: boolean; defaultBranch?: string; error?: string }> {
    const token = await this.getDecryptedToken(userId);
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      return {
        hasAccess: true,
        isPrivate: res.data.private,
        defaultBranch: res.data.default_branch || 'main',
      };
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        return {
          hasAccess: false,
          error:
            'Repository access is required. SprintForge cannot access this repository with the current GitHub permissions.',
        };
      }
      return {
        hasAccess: false,
        error: err.response?.data?.message || err.message || 'Failed to verify repository access',
      };
    }
  }

  /**
   * Fetches public and private repositories accessible by the user.
   */
  public static async getUserRepositories(
    userId: string,
    page: number = 1,
    perPage: number = 50,
    search?: string
  ): Promise<{ repositories: GitHubRepoItem[]; totalCount?: number }> {
    const token = await this.getDecryptedToken(userId);
    if (!token) {
      throw new Error('GitHub account not connected. Please connect your GitHub account.');
    }

    try {
      const reposRes = await axios.get('https://api.github.com/user/repos', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          sort: 'updated',
          direction: 'desc',
          per_page: perPage,
          page,
          affiliation: 'owner,collaborator,organization_member',
        },
      });

      let repos: any[] = reposRes.data;

      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        repos = repos.filter(
          (r) =>
            r.name?.toLowerCase().includes(q) ||
            (r.description && r.description.toLowerCase().includes(q)) ||
            r.full_name?.toLowerCase().includes(q)
        );
      }

      const formatted: GitHubRepoItem[] = repos.map((r: any) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        owner: r.owner?.login || '',
        avatarUrl: r.owner?.avatar_url || '',
        isPrivate: Boolean(r.private),
        htmlUrl: r.html_url,
        cloneUrl: r.clone_url,
        defaultBranch: r.default_branch || 'main',
        description: r.description || '',
        updatedAt: r.updated_at,
        stargazersCount: r.stargazers_count || 0,
        language: r.language || 'Unknown',
      }));

      // Update cached count in DB
      if (formatted.length > 0) {
        GitHubConnection.updateOne(
          { user: userId },
          { repositoryCount: formatted.length, lastSyncedAt: new Date() }
        ).catch(() => {});
      }

      return { repositories: formatted, totalCount: formatted.length };
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.headers?.['x-ratelimit-remaining'] === '0') {
        throw new Error('GitHub API rate limit reached. Please try again in a few minutes.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch repositories from GitHub');
    }
  }

  /**
   * Validates GitHub Webhook HMAC-SHA256 signature.
   */
  public static validateWebhookSignature(
    rawBody: string | Buffer,
    signatureHeader?: string
  ): boolean {
    if (!this.webhookSecret || !signatureHeader) return true;

    try {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(rawBody);
      const expected = `sha256=${hmac.digest('hex')}`;
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
    } catch {
      return false;
    }
  }

  /**
   * Disconnects GitHub account for a user.
   */
  public static async disconnect(userId: string): Promise<boolean> {
    await GitHubConnection.deleteOne({ user: userId });
    return true;
  }
}
