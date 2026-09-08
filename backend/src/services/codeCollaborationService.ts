import * as Y from 'yjs';
import { WorkspaceService } from './workspaceService';
import CodeDocumentVersion from '../models/CodeDocumentVersion';
import CodeActivity from '../models/CodeActivity';
import mongoose from 'mongoose';

export interface ActiveDocSession {
  doc: Y.Doc;
  yText: Y.Text;
  projectId: string;
  filePath: string;
  lastModifiedBy?: string;
  flushTimeout?: NodeJS.Timeout;
  versionCount: number;
}

// In-memory active Yjs documents: `${projectId}:${filePath}` -> ActiveDocSession
const activeDocs = new Map<string, ActiveDocSession>();

export class CodeCollaborationService {
  /**
   * Retrieves or initializes an active Yjs document session for a project file.
   */
  public static async getOrCreateDoc(
    projectId: string,
    filePath: string
  ): Promise<ActiveDocSession> {
    const docKey = `${projectId}:${filePath.replace(/\\/g, '/')}`;

    if (activeDocs.has(docKey)) {
      return activeDocs.get(docKey)!;
    }

    const doc = new Y.Doc();
    const yText = doc.getText('monaco');

    // Read initial content from disk workspace
    try {
      const { content } = await WorkspaceService.readFile(projectId, filePath);
      doc.transact(() => {
        yText.insert(0, content);
      });
    } catch {
      // If file is newly created or empty
    }

    const session: ActiveDocSession = {
      doc,
      yText,
      projectId,
      filePath,
      versionCount: 1,
    };

    activeDocs.set(docKey, session);
    return session;
  }

  /**
   * Applies an incremental update to the in-memory Yjs doc and schedules a debounced disk flush.
   */
  public static async applyUpdate(
    projectId: string,
    filePath: string,
    update: Uint8Array | number[],
    userId?: string,
    userName?: string
  ): Promise<void> {
    const session = await this.getOrCreateDoc(projectId, filePath);
    const updateArr = update instanceof Uint8Array ? update : new Uint8Array(update);

    Y.applyUpdate(session.doc, updateArr);
    if (userId) session.lastModifiedBy = userId;

    // Schedule debounced disk flush (2.5 seconds)
    if (session.flushTimeout) {
      clearTimeout(session.flushTimeout);
    }

    session.flushTimeout = setTimeout(() => {
      this.flushToDisk(projectId, filePath, userId, userName);
    }, 2500);
  }

  /**
   * Flushes in-memory Yjs text content to disk file and creates a CodeDocumentVersion snapshot.
   */
  public static async flushToDisk(
    projectId: string,
    filePath: string,
    userId?: string,
    userName?: string
  ): Promise<void> {
    const docKey = `${projectId}:${filePath.replace(/\\/g, '/')}`;
    const session = activeDocs.get(docKey);
    if (!session) return;

    try {
      const content = session.yText.toString();
      await WorkspaceService.writeFile(projectId, filePath, content);

      // Record document version snapshot if valid user ID provided
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        session.versionCount++;
        await CodeDocumentVersion.create({
          project: projectId,
          file: filePath,
          versionNumber: session.versionCount,
          user: userId,
          content,
          summary: `Auto-saved by ${userName || 'Collaborator'}`,
        });

        // Audit log
        await CodeActivity.create({
          project: projectId,
          user: userId,
          file: filePath,
          action: 'modified',
          details: `${userName || 'User'} modified ${filePath}`,
          metadata: {
            diffSnippet: content.slice(0, 150),
          },
        });
      }
    } catch (err) {
      console.error(`[COLLAB] Error flushing ${filePath} to disk:`, err);
    }
  }

  /**
   * Generates the binary state vector of a document for synchronization.
   */
  public static async getStateVector(projectId: string, filePath: string): Promise<Uint8Array> {
    const session = await this.getOrCreateDoc(projectId, filePath);
    return Y.encodeStateVector(session.doc);
  }

  /**
   * Resets or updates in-memory Yjs doc content from external disk modifications.
   */
  public static async reloadFromDisk(projectId: string, filePath: string): Promise<void> {
    const docKey = `${projectId}:${filePath.replace(/\\/g, '/')}`;
    const session = activeDocs.get(docKey);
    if (!session) return;

    try {
      const { content } = await WorkspaceService.readFile(projectId, filePath);
      if (session.yText.toString() !== content) {
        session.doc.transact(() => {
          session.yText.delete(0, session.yText.length);
          session.yText.insert(0, content);
        });
      }
    } catch {}
  }

  /**
   * Evicts in-memory document session.
   */
  public static evictDoc(projectId: string, filePath: string): void {
    const docKey = `${projectId}:${filePath.replace(/\\/g, '/')}`;
    const session = activeDocs.get(docKey);
    if (session) {
      if (session.flushTimeout) clearTimeout(session.flushTimeout);
      activeDocs.delete(docKey);
    }
  }
}
