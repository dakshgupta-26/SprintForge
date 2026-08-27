import { Server, Socket } from 'socket.io';
import Message from '../models/Message';
import { encryptMessage } from '../utils/crypto';

// Track socketId → { userId, projectId }
const socketMeta: Record<string, { userId?: string; projectId?: string }> = {};

// Project Presence Tracking: projectId → Map<userId, Set<socketId>>
const projectPresence = new Map<string, Map<string, Set<string>>>();

const getOnlineUsersInProject = (projectId: string): string[] => {
  const userMap = projectPresence.get(projectId);
  if (!userMap) return [];
  return Array.from(userMap.keys());
};

export const initSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    socketMeta[socket.id] = {};

    // Join user's personal room for notifications
    socket.on('join:user', (userId: string) => {
      if (!userId) return;
      socket.join(userId);
      socketMeta[socket.id].userId = userId;
      console.log(`User ${userId} joined their personal room`);
    });

    // Join project room — server-authoritative presence
    socket.on('join:project', (data: string | { projectId: string; userId?: string }) => {
      const projectId = typeof data === 'string' ? data : data?.projectId;
      const userId = (typeof data === 'object' && data?.userId) || socketMeta[socket.id]?.userId;

      if (!projectId) return;

      socket.join(`project:${projectId}`);
      if (!socketMeta[socket.id]) socketMeta[socket.id] = {};
      socketMeta[socket.id].projectId = projectId;
      if (userId) socketMeta[socket.id].userId = userId;

      console.log(`Socket ${socket.id} joined project room: ${projectId} (User: ${userId || 'unknown'})`);

      if (userId) {
        if (!projectPresence.has(projectId)) {
          projectPresence.set(projectId, new Map());
        }
        const userMap = projectPresence.get(projectId)!;
        if (!userMap.has(userId)) {
          userMap.set(userId, new Set());
        }
        userMap.get(userId)!.add(socket.id);

        const onlineUserIds = getOnlineUsersInProject(projectId);

        // 1. Immediately send full authoritative list to this joining client
        socket.emit('presence:sync', {
          projectId,
          onlineUserIds,
        });

        // 2. Broadcast updated list to the entire project room
        io.to(`project:${projectId}`).emit('presence:update', {
          projectId,
          onlineUserIds,
          joinedUserId: userId,
        });
      }
    });

    // Leave project room — server-authoritative cleanup
    const handleLeaveProject = (projectId: string, socketId: string) => {
      const userId = socketMeta[socketId]?.userId;
      if (projectId && userId && projectPresence.has(projectId)) {
        const userMap = projectPresence.get(projectId)!;
        if (userMap.has(userId)) {
          const socketSet = userMap.get(userId)!;
          socketSet.delete(socketId);
          if (socketSet.size === 0) {
            userMap.delete(userId);
          }
        }
        if (userMap.size === 0) {
          projectPresence.delete(projectId);
        }

        const onlineUserIds = getOnlineUsersInProject(projectId);
        io.to(`project:${projectId}`).emit('presence:update', {
          projectId,
          onlineUserIds,
          leftUserId: userId,
        });
      }
    };

    socket.on('leave:project', (data: string | { projectId: string; userId?: string }) => {
      const projectId = typeof data === 'string' ? data : data?.projectId;
      if (projectId) {
        socket.leave(`project:${projectId}`);
        handleLeaveProject(projectId, socket.id);
        if (socketMeta[socket.id]) {
          socketMeta[socket.id].projectId = undefined;
        }
      }
    });

    // ─── Project Chat Rooms ───
    socket.on('chat:message', async (data: { projectId: string; sender: any; content: string }) => {
      const { projectId, sender, content } = data;
      try {
        // Encrypt message content before saving it
        const { iv, encryptedData } = encryptMessage(content);

        const newMessage = await Message.create({
          project: projectId,
          sender: sender._id,
          content: encryptedData,
          iv,
          readBy: [],
          reactions: {},
        });

        // Broadcast to everyone in the project room
        io.to(`project:${projectId}`).emit('chat:message:receive', {
          _id: newMessage._id,
          project: projectId,
          sender: sender,
          content: content,
          readBy: [],
          reactions: {},
          createdAt: newMessage.createdAt,
          updatedAt: newMessage.updatedAt,
        });
      } catch (err) {
        console.error('Failed to save encrypted message:', err);
      }
    });

    // ─── Read Receipts ───
    socket.on('chat:message:read', async (data: { projectId: string; messageIds: string[]; userId: string; user?: any }) => {
      const { projectId, messageIds, userId, user } = data;
      if (!projectId || !userId || !Array.isArray(messageIds) || messageIds.length === 0) return;

      try {
        const now = new Date();
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            project: projectId,
            sender: { $ne: userId },
            'readBy.user': { $ne: userId },
          },
          {
            $addToSet: {
              readBy: {
                user: userId,
                readAt: now,
              },
            },
          }
        );

        io.to(`project:${projectId}`).emit('chat:message:read:update', {
          projectId,
          messageIds,
          userId,
          user: user || { _id: userId },
          readAt: now.toISOString(),
        });
      } catch (err) {
        console.error('Failed to process message read receipts:', err);
      }
    });

    // ─── Reactions ───
    socket.on('chat:message:react', async (data: { projectId: string; messageId: string; emoji: string; userId: string }) => {
      const { projectId, messageId, emoji, userId } = data;
      if (!projectId || !messageId || !emoji || !userId) return;

      try {
        const msg = await Message.findById(messageId);
        if (msg) {
          const reactions = msg.reactions || {};
          const currentList: string[] = reactions[emoji] || [];
          let updatedList: string[];
          if (currentList.includes(userId)) {
            updatedList = currentList.filter((id) => id !== userId);
          } else {
            updatedList = [...currentList, userId];
          }

          if (updatedList.length > 0) {
            reactions[emoji] = updatedList;
          } else {
            delete reactions[emoji];
          }

          msg.reactions = reactions;
          msg.markModified('reactions');
          await msg.save();

          io.to(`project:${projectId}`).emit('chat:message:react:update', {
            projectId,
            messageId,
            reactions,
          });
        }
      } catch (err) {
        console.error('Failed to update reaction:', err);
      }
    });

    // ─── Typing ───
    socket.on('chat:typing:start', ({ projectId, userId, userName }) => {
      socket.to(`project:${projectId}`).emit('chat:typing:start', { userId, userName });
    });

    socket.on('chat:typing:stop', ({ projectId, userId }) => {
      socket.to(`project:${projectId}`).emit('chat:typing:stop', { userId });
    });

    // Join task room for real-time comments
    socket.on('join:task', (taskId: string) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('typing:start', ({ taskId, userId, userName }) => {
      socket.to(`task:${taskId}`).emit('typing:start', { userId, userName });
    });

    socket.on('typing:stop', ({ taskId, userId }) => {
      socket.to(`task:${taskId}`).emit('typing:stop', { userId });
    });

    // Broadcast board cursor (live collaboration)
    socket.on('cursor:move', ({ projectId, userId, userName, position }) => {
      socket.to(`project:${projectId}`).emit('cursor:move', { userId, userName, position });
    });

    // On disconnect — server-authoritative presence cleanup
    socket.on('disconnect', () => {
      const meta = socketMeta[socket.id];
      if (meta?.projectId) {
        handleLeaveProject(meta.projectId, socket.id);
      }
      delete socketMeta[socket.id];
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
