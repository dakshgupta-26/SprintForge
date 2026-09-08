import axios from 'axios';
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
  private static clientId = process.env.GITHUB_CLIENT_ID || '';
  private static clientSecret = process.env.GITHUB_CLIENT_SECRET || '';

  /**
   * Generates GitHub OAuth authorization URL.
   */
  public static getOAuthUrl(state: string, redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: 'repo read:user user:email',
      state,
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
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
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        ...(redirectUri ? { redirect_uri: redirectUri } : {}),
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const { access_token, scope } = tokenRes.data;
    if (!access_token) {
      throw new Error(tokenRes.data.error_description || 'Failed to obtain access token from GitHub');
    }

    return await this.saveUserToken(userId, access_token, scope ? scope.split(',') : ['repo']);
  }

  /**
   * Connects a user account directly with an access token / PAT (useful for self-hosted / local dev).
   */
  public static async saveUserToken(
    userId: string,
    accessToken: string,
    scopes: string[] = ['repo']
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
      connectedAt: conn.connectedAt,
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
   * Fetches public and private repositories accessible by the user.
   */
  public static async getUserRepositories(
    userId: string,
    page: number = 1,
    perPage: number = 30,
    search?: string
  ): Promise<{ repositories: GitHubRepoItem[]; totalCount?: number }> {
    const token = await this.getDecryptedToken(userId);
    if (!token) {
      throw new Error('GitHub account not connected. Please connect your GitHub account.');
    }

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
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.full_name.toLowerCase().includes(q)
      );
    }

    const formatted: GitHubRepoItem[] = repos.map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner?.login || '',
      avatarUrl: r.owner?.avatar_url || '',
      isPrivate: r.private,
      htmlUrl: r.html_url,
      cloneUrl: r.clone_url,
      defaultBranch: r.default_branch || 'main',
      description: r.description || '',
      updatedAt: r.updated_at,
      stargazersCount: r.stargazers_count || 0,
      language: r.language || 'Unknown',
    }));

    return { repositories: formatted };
  }

  /**
   * Disconnects GitHub account for a user.
   */
  public static async disconnect(userId: string): Promise<boolean> {
    await GitHubConnection.deleteOne({ user: userId });
    return true;
  }
}
