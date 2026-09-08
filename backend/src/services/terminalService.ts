import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { WorkspaceService } from './workspaceService';

export interface TerminalSession {
  id: string;
  projectId: string;
  userId: string;
  process: ChildProcess;
  createdAt: Date;
  lastActiveAt: Date;
}

// Global active sessions: sessionKey (e.g. `${projectId}:${userId}:${sessionId}`) -> TerminalSession
const activeSessions = new Map<string, TerminalSession>();

// Dangerous environment keys stripped before running user commands
const SENSITIVE_ENV_KEYS = [
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'MONGODB_URI',
  'ENCRYPTION_KEY',
  'MAILJET_API_KEY',
  'MAILJET_SECRET_KEY',
  'MAILJET_FROM_EMAIL',
  'MAILJET_FROM_NAME',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'RESEND_API_KEY',
  'SENDGRID_API_KEY',
];

export class TerminalService {
  /**
   * Builds a sanitized environment object for the terminal process.
   */
  private static getSanitizedEnv(projectId: string): NodeJS.ProcessEnv {
    const safeEnv = { ...process.env };
    for (const key of SENSITIVE_ENV_KEYS) {
      delete safeEnv[key];
    }
    safeEnv.SPRINTFORGE_PROJECT_ID = projectId;
    safeEnv.TERM = 'xterm-256color';
    safeEnv.COLORTERM = 'truecolor';
    return safeEnv;
  }

  /**
   * Spawns a new interactive shell session inside the workspace root.
   */
  public static createSession(
    projectId: string,
    userId: string,
    sessionId: string,
    onData: (data: string) => void,
    onExit: (code: number | null) => void
  ): TerminalSession {
    const sessionKey = `${projectId}:${userId}:${sessionId}`;

    // Clean up any existing session with the same key
    this.killSession(projectId, userId, sessionId);

    const cwd = WorkspaceService.getWorkspaceRoot(projectId);
    const env = this.getSanitizedEnv(projectId);

    const isWin = process.platform === 'win32';
    const shell = isWin ? 'powershell.exe' : (process.env.SHELL || 'bash');
    const shellArgs = isWin ? ['-NoLogo', '-NoExit'] : ['-i'];

    const child = spawn(shell, shellArgs, {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const session: TerminalSession = {
      id: sessionId,
      projectId,
      userId,
      process: child,
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };

    activeSessions.set(sessionKey, session);

    // Initial banner
    onData(`\x1b[1;35m⚡ SprintForge Workspace Terminal Initialized\x1b[0m\r\n`);
    onData(`\x1b[90mDirectory: ${cwd.replace(/\\/g, '/')}\x1b[0m\r\n\r\n`);

    child.stdout?.on('data', (chunk: Buffer) => {
      session.lastActiveAt = new Date();
      onData(chunk.toString('utf-8'));
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      session.lastActiveAt = new Date();
      onData(chunk.toString('utf-8'));
    });

    child.on('close', (code) => {
      activeSessions.delete(sessionKey);
      onExit(code);
    });

    child.on('error', (err) => {
      onData(`\r\n\x1b[31mTerminal process error: ${err.message}\x1b[0m\r\n`);
    });

    return session;
  }

  /**
   * Writes input (stdin / keystrokes) to the active terminal process.
   */
  public static writeInput(
    projectId: string,
    userId: string,
    sessionId: string,
    input: string
  ): boolean {
    const sessionKey = `${projectId}:${userId}:${sessionId}`;
    const session = activeSessions.get(sessionKey);
    if (!session || !session.process.stdin?.writable) {
      return false;
    }

    session.lastActiveAt = new Date();
    session.process.stdin.write(input);
    return true;
  }

  /**
   * Terminates an active terminal session.
   */
  public static killSession(projectId: string, userId: string, sessionId: string): boolean {
    const sessionKey = `${projectId}:${userId}:${sessionId}`;
    const session = activeSessions.get(sessionKey);
    if (session) {
      try {
        session.process.kill();
      } catch {}
      activeSessions.delete(sessionKey);
      return true;
    }
    return false;
  }

  /**
   * Cleans up all sessions for a disconnected user.
   */
  public static cleanupUserSessions(userId: string) {
    for (const [key, session] of activeSessions.entries()) {
      if (session.userId === userId) {
        try {
          session.process.kill();
        } catch {}
        activeSessions.delete(key);
      }
    }
  }
}
