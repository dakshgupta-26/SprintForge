import { Server, Socket } from 'socket.io';
import { CodeCollaborationService } from '../services/codeCollaborationService';
import { TerminalService } from '../services/terminalService';
import { getEffectiveCodePermission } from '../middleware/codeRbac';

interface CodeUserMeta {
  userId: string;
  name: string;
  avatar?: string;
  color?: string;
  projectId?: string;
  activeFile?: string;
  cursor?: { line: number; column: number };
  selection?: any;
}

// Track socket presence in project code workspaces
// projectId -> Map<socketId, CodeUserMeta>
const codeWorkspacePresence = new Map<string, Map<string, CodeUserMeta>>();

// Pre-defined vibrant collaborator cursor colors
const CURSOR_COLORS = [
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
];

const getUserColor = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
};

export const registerCodeSocketHandlers = (io: Server, socket: Socket) => {
  const authUser = (socket as any).user;

  // ─── 1. Join Project Code Workspace ──────────────────────────────────────────
  socket.on(
    'code:join:workspace',
    async (data: { projectId: string; userId?: string; name?: string; avatar?: string }) => {
      const projectId = data.projectId;
      const effectiveUserId = authUser?._id || data.userId;
      if (!projectId || !effectiveUserId) return;

      const perm = await getEffectiveCodePermission(projectId, effectiveUserId, authUser?.role);
      if (!perm) {
        socket.emit('code:error', { message: 'Not authorized for this code workspace' });
        return;
      }

      socket.join(`code:workspace:${projectId}`);

      if (!codeWorkspacePresence.has(projectId)) {
        codeWorkspacePresence.set(projectId, new Map());
      }

      const userColor = getUserColor(effectiveUserId);
      const meta: CodeUserMeta = {
        userId: effectiveUserId,
        name: authUser?.name || data.name || 'Collaborator',
        avatar: authUser?.avatar || data.avatar || '',
        color: userColor,
        projectId,
      };

      codeWorkspacePresence.get(projectId)!.set(socket.id, meta);

      // Broadcast updated workspace presence
      const activeList = Array.from(codeWorkspacePresence.get(projectId)!.values());
      io.to(`code:workspace:${projectId}`).emit('code:presence:sync', {
        projectId,
        collaborators: activeList,
      });
    }
  );

  // ─── 2. Update Active File Presence ──────────────────────────────────────────
  socket.on(
    'code:presence:active_file',
    (data: { projectId: string; activeFile?: string }) => {
      const { projectId, activeFile } = data;
      if (!projectId) return;

      const projectPres = codeWorkspacePresence.get(projectId);
      if (projectPres && projectPres.has(socket.id)) {
        const meta = projectPres.get(socket.id)!;
        meta.activeFile = activeFile;

        const activeList = Array.from(projectPres.values());
        io.to(`code:workspace:${projectId}`).emit('code:presence:sync', {
          projectId,
          collaborators: activeList,
        });
      }
    }
  );

  // ─── 3. Join Specific File Room for Live Yjs Collaboration ───────────────────
  socket.on(
    'code:join:file',
    async (data: { projectId: string; filePath: string; clientStateVector?: number[] }) => {
      const { projectId, filePath, clientStateVector } = data;
      const effectiveUserId = authUser?._id || (socket as any).userId;
      if (!projectId || !filePath) return;

      const normPath = filePath.replace(/\\/g, '/');
      const roomKey = `code:${projectId}:${normPath}`;
      socket.join(roomKey);

      try {
        // Send initial document sync step 2 diff against client's state vector
        const targetVec = clientStateVector ? new Uint8Array(clientStateVector) : undefined;
        const diffUpdate = await CodeCollaborationService.encodeStateAsUpdate(
          projectId,
          normPath,
          targetVec
        );

        socket.emit('code:sync:step2', {
          projectId,
          filePath: normPath,
          update: Array.from(diffUpdate),
        });
      } catch (err) {
        console.error(`[COLLAB] Error joining file ${normPath}:`, err);
      }
    }
  );

  // ─── 4. Leave Specific File Room ─────────────────────────────────────────────
  socket.on('code:leave:file', (data: { projectId: string; filePath: string }) => {
    const { projectId, filePath } = data;
    if (!projectId || !filePath) return;

    const normPath = filePath.replace(/\\/g, '/');
    const roomKey = `code:${projectId}:${normPath}`;
    socket.leave(roomKey);

    // Notify room that user left cursor
    socket.to(roomKey).emit('code:awareness:leave', {
      socketId: socket.id,
      userId: authUser?._id,
      filePath: normPath,
    });
  });

  // ─── 5. Yjs Document Incremental Updates ─────────────────────────────────────
  socket.on(
    'code:doc:update',
    async (data: { projectId: string; filePath: string; update: number[] }) => {
      const { projectId, filePath, update } = data;
      const effectiveUserId = authUser?._id;
      if (!projectId || !filePath || !update) return;

      const normPath = filePath.replace(/\\/g, '/');
      const roomKey = `code:${projectId}:${normPath}`;

      try {
        // Apply to server document & schedule debounced disk flush
        await CodeCollaborationService.applyUpdate(
          projectId,
          normPath,
          update,
          effectiveUserId,
          authUser?.name
        );

        // Broadcast binary update to all peers in the file room except sender
        socket.to(roomKey).emit('code:doc:update', {
          projectId,
          filePath: normPath,
          update,
          senderSocketId: socket.id,
        });
      } catch (err) {
        console.error(`[COLLAB] Error applying update to ${normPath}:`, err);
      }
    }
  );

  // ─── 6. Live Awareness (Cursors, Selections, User Info) ───────────────────────
  socket.on(
    'code:awareness:update',
    (data: {
      projectId: string;
      filePath: string;
      cursor?: { line: number; column: number };
      selection?: any;
    }) => {
      const { projectId, filePath, cursor, selection } = data;
      const effectiveUserId = authUser?._id;
      if (!projectId || !filePath) return;

      const normPath = filePath.replace(/\\/g, '/');
      const roomKey = `code:${projectId}:${normPath}`;

      const userColor = effectiveUserId ? getUserColor(effectiveUserId) : '#a855f7';

      socket.to(roomKey).emit('code:awareness:update', {
        socketId: socket.id,
        userId: effectiveUserId,
        userName: authUser?.name || 'Collaborator',
        avatar: authUser?.avatar || '',
        color: userColor,
        filePath: normPath,
        cursor,
        selection,
      });
    }
  );

  // ─── 7. Interactive Terminal over WebSocket ──────────────────────────────────
  socket.on(
    'code:terminal:start',
    async (data: { projectId: string; sessionId: string }) => {
      const { projectId, sessionId } = data;
      const effectiveUserId = authUser?._id;
      if (!projectId || !sessionId || !effectiveUserId) return;

      // Verify permission
      const perm = await getEffectiveCodePermission(projectId, effectiveUserId, authUser?.role);
      if (perm !== 'WRITE') {
        socket.emit('code:terminal:data', {
          sessionId,
          data: `\r\n\x1b[31mPermission denied: Terminal execution requires WRITE permission.\x1b[0m\r\n`,
        });
        return;
      }

      TerminalService.createSession(
        projectId,
        effectiveUserId,
        sessionId,
        (outData: string) => {
          socket.emit('code:terminal:data', { sessionId, data: outData });
        },
        (exitCode: number | null) => {
          socket.emit('code:terminal:exit', { sessionId, code: exitCode });
        }
      );
    }
  );

  socket.on(
    'code:terminal:input',
    (data: { projectId: string; sessionId: string; data: string }) => {
      const { projectId, sessionId, data: inputData } = data;
      const effectiveUserId = authUser?._id;
      if (!projectId || !sessionId || !effectiveUserId) return;

      TerminalService.writeInput(projectId, effectiveUserId, sessionId, inputData);
    }
  );

  socket.on(
    'code:terminal:kill',
    (data: { projectId: string; sessionId: string }) => {
      const { projectId, sessionId } = data;
      const effectiveUserId = authUser?._id;
      if (!projectId || !sessionId || !effectiveUserId) return;

      TerminalService.killSession(projectId, effectiveUserId, sessionId);
    }
  );

  // ─── 8. Disconnect Cleanup ───────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const effectiveUserId = authUser?._id;
    if (effectiveUserId) {
      TerminalService.cleanupUserSessions(effectiveUserId);
    }

    // Clean up presence from all project workspaces
    for (const [projectId, presMap] of codeWorkspacePresence.entries()) {
      if (presMap.has(socket.id)) {
        presMap.delete(socket.id);
        const activeList = Array.from(presMap.values());
        io.to(`code:workspace:${projectId}`).emit('code:presence:sync', {
          projectId,
          collaborators: activeList,
        });
      }
    }
  });
};
