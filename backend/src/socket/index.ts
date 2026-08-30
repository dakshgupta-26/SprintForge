import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import Message from '../models/Message';
import Project from '../models/Project';
import User from '../models/User';
import ChatReadCursor from '../models/ChatReadCursor';
import { encryptMessage } from '../utils/crypto';

// Track socketId → { userId, projectId, name, email, avatar }
const socketMeta: Record<
  string,
  { userId?: string; projectId?: string; name?: string; email?: string; avatar?: string }
> = {};

// Project Presence Tracking: projectId → Map<userId, Set<socketId>>
const projectPresence = new Map<string, Map<string, Set<string>>>();

const getOnlineUsersInProject = (projectId: string): string[] => {
  const userMap = projectPresence.get(projectId);
  if (!userMap) return [];
  return Array.from(userMap.keys());
};

export const initSocket = (io: Server) => {
  // ─── Socket Authentication Middleware ───────────────────────────────────────
  io.use(async (socket: Socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Also check cookies in socket handshake
      if (!token && socket.handshake.headers?.cookie) {
        const parsedCookies = cookie.parse(socket.handshake.headers.cookie);
        token = parsedCookies.sf_access_token;
      }

      if (token) {
        try {
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
          const userId = decoded.id || decoded.userId;
          if (userId) {
            const user = await User.findById(userId).select('name email avatar').lean();
            if (user) {
              (socket as any).user = {
                _id: String(user._id),
                name: user.name,
                email: user.email,
                avatar: user.avatar,
              };
            }
          }
        } catch (jwtErr) {
          // Token expired or invalid
        }
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const authUser = (socket as any).user;
    if (authUser?._id) {
      socket.join(String(authUser._id));
    }

    socketMeta[socket.id] = {
      userId: authUser?._id,
      name: authUser?.name,
      email: authUser?.email,
      avatar: authUser?.avatar,
    };

    // Join user's personal room for direct notifications
    socket.on('join:user', (userId: string) => {
      const targetUserId = authUser?._id || userId;
      if (!targetUserId) return;
      socket.join(String(targetUserId));
      if (!socketMeta[socket.id]) socketMeta[socket.id] = {};
      socketMeta[socket.id].userId = String(targetUserId);
    });

    // Join project room — server-authoritative presence with membership check
    socket.on('join:project', async (data: string | { projectId: string; userId?: string }) => {
      const projectId = typeof data === 'string' ? data : data?.projectId;
      const effectiveUserId = authUser?._id || (typeof data === 'object' && data?.userId) || socketMeta[socket.id]?.userId;

      if (!projectId) return;

      // Verify user has access to this project before allowing room subscription
      if (effectiveUserId) {
        try {
          const project = await Project.findById(projectId).select('owner members isPrivate').lean();
          if (project) {
            const isOwner = String(project.owner) === String(effectiveUserId);
            const isMember = (project.members as any[]).some((m) => String(m.user) === String(effectiveUserId));

            if (!isOwner && !isMember && project.isPrivate) {
              socket.emit('error', { message: 'Not authorized to join this project room' });
              return;
            }
          }
        } catch (err) {
          console.error('Project room authorization error:', err);
        }
      }

      socket.join(`project:${projectId}`);
      if (!socketMeta[socket.id]) socketMeta[socket.id] = {};
      socketMeta[socket.id].projectId = projectId;
      if (effectiveUserId) socketMeta[socket.id].userId = effectiveUserId;

      if (effectiveUserId) {
        if (!projectPresence.has(projectId)) {
          projectPresence.set(projectId, new Map());
        }
        const userMap = projectPresence.get(projectId)!;
        if (!userMap.has(effectiveUserId)) {
          userMap.set(effectiveUserId, new Set());
        }
        userMap.get(effectiveUserId)!.add(socket.id);

        const onlineUserIds = getOnlineUsersInProject(projectId);

        // 1. Send authoritative list to this joining client
        socket.emit('presence:sync', {
          projectId,
          onlineUserIds,
        });

        // 2. Broadcast updated list to the entire project room
        io.to(`project:${projectId}`).emit('presence:update', {
          projectId,
          onlineUserIds,
          joinedUserId: effectiveUserId,
        });
      }
    });

    // Leave project room
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
    socket.on('chat:message', async (data: { projectId: string; sender?: any; content: string; attachments?: any[] }) => {
      const { projectId, content, attachments = [] } = data;
      const senderInfo = authUser || data.sender || socketMeta[socket.id];
      const senderId = senderInfo?._id || senderInfo?.userId;

      if (!projectId || (!content && attachments.length === 0) || !senderId) return;

      try {
        // Encrypt message content before saving
        const { iv, encryptedData } = encryptMessage(content || '');

        const formattedAttachments = (attachments || []).map((att: any) => ({
          _id: att._id,
          fileId: att.fileId,
          originalName: att.originalName,
          mimeType: att.mimeType,
          size: att.size,
          uploadedBy: senderId,
          createdAt: att.createdAt || new Date(),
        }));

        const newMessage = await Message.create({
          project: projectId,
          sender: senderId,
          content: encryptedData,
          iv,
          attachments: formattedAttachments,
          readBy: [{ user: senderId, readAt: new Date() }], // Sender has implicitly read their own message
          reactions: {},
        });

        // 1. Broadcast to everyone in the project room
        io.to(`project:${projectId}`).emit('chat:message:receive', {
          _id: newMessage._id,
          project: projectId,
          sender: {
            _id: senderId,
            name: senderInfo?.name || 'Team Member',
            avatar: senderInfo?.avatar || '',
            email: senderInfo?.email || '',
          },
          content: content || '',
          attachments: newMessage.attachments || [],
          readBy: [{ user: senderId, readAt: newMessage.createdAt }],
          reactions: {},
          createdAt: newMessage.createdAt,
          updatedAt: newMessage.updatedAt,
        });

        // 2. Deliver unread notifications to project members (excluding sender)
        const project = await Project.findById(projectId).select('name key members owner').lean();
        if (project) {
          const recipientIds = new Set<string>();
          if (project.owner && String(project.owner) !== String(senderId)) {
            recipientIds.add(String(project.owner));
          }
          if (Array.isArray(project.members)) {
            project.members.forEach((m: any) => {
              const mId = String(m.user || m);
              if (mId && mId !== String(senderId)) {
                recipientIds.add(mId);
              }
            });
          }

          // Emit to each recipient's user room
          recipientIds.forEach((recipientId) => {
            io.to(recipientId).emit('chat:new_message_notification', {
              projectId: String(projectId),
              projectName: project.name,
              projectKey: project.key,
              messageId: String(newMessage._id),
              sender: {
                _id: String(senderId),
                name: senderInfo?.name || 'Team Member',
                avatar: senderInfo?.avatar || '',
              },
              createdAt: newMessage.createdAt,
            });

            io.to(recipientId).emit('chat:unread:update', {
              projectId: String(projectId),
              increment: 1,
            });
          });
        }
      } catch (err) {
        console.error('Failed to save encrypted message:', err);
      }
    });

    // ─── Read Receipts ───
    socket.on('chat:message:read', async (data: { projectId: string; messageIds: string[]; userId?: string; user?: any }) => {
      const effectiveUserId = authUser?._id || data.userId || socketMeta[socket.id]?.userId;
      const { projectId, messageIds } = data;
      if (!projectId || !effectiveUserId || !Array.isArray(messageIds) || messageIds.length === 0) return;

      try {
        const now = new Date();
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            project: projectId,
            sender: { $ne: effectiveUserId },
            'readBy.user': { $ne: effectiveUserId },
          },
          {
            $addToSet: {
              readBy: {
                user: effectiveUserId,
                readAt: now,
              },
            },
          }
        );

        // Update read cursor
        const lastMsgId = messageIds[messageIds.length - 1];
        await ChatReadCursor.findOneAndUpdate(
          { user: effectiveUserId, project: projectId },
          { $set: { lastReadAt: now, lastReadMessageId: lastMsgId } },
          { upsert: true }
        );

        // Sync tabs of this user
        io.to(String(effectiveUserId)).emit('chat:read_state:sync', {
          projectId,
          unreadCount: 0,
          readAt: now.toISOString(),
        });

        // Broadcast checkmark updates to project room
        io.to(`project:${projectId}`).emit('chat:message:read:update', {
          projectId,
          messageIds,
          userId: effectiveUserId,
          user: data.user || { _id: effectiveUserId, name: authUser?.name },
          readAt: now.toISOString(),
        });
      } catch (err) {
        console.error('Failed to process message read receipts:', err);
      }
    });

    // ─── Reactions ───
    socket.on('chat:message:react', async (data: { projectId: string; messageId: string; emoji: string; userId?: string }) => {
      const effectiveUserId = authUser?._id || data.userId || socketMeta[socket.id]?.userId;
      const { projectId, messageId, emoji } = data;
      if (!projectId || !messageId || !emoji || !effectiveUserId) return;

      try {
        const msg = await Message.findById(messageId);
        if (msg) {
          const reactions = msg.reactions || {};
          const currentList: string[] = reactions[emoji] || [];
          let updatedList: string[];
          if (currentList.includes(effectiveUserId)) {
            updatedList = currentList.filter((id) => id !== effectiveUserId);
          } else {
            updatedList = [...currentList, effectiveUserId];
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

    // ─── Typing Indicators ───
    socket.on('chat:typing:start', ({ projectId, userId, userName }) => {
      const senderId = authUser?._id || userId;
      const senderName = authUser?.name || userName;
      socket.to(`project:${projectId}`).emit('chat:typing:start', { userId: senderId, userName: senderName });
    });

    socket.on('chat:typing:stop', ({ projectId, userId }) => {
      const senderId = authUser?._id || userId;
      socket.to(`project:${projectId}`).emit('chat:typing:stop', { userId: senderId });
    });

    // Task collaboration
    socket.on('join:task', (taskId: string) => {
      if (taskId) socket.join(`task:${taskId}`);
    });

    socket.on('typing:start', ({ taskId, userId, userName }) => {
      socket.to(`task:${taskId}`).emit('typing:start', { userId, userName });
    });

    socket.on('typing:stop', ({ taskId, userId }) => {
      socket.to(`task:${taskId}`).emit('typing:stop', { userId });
    });

    // Live Board Cursor
    socket.on('cursor:move', ({ projectId, userId, userName, position }) => {
      socket.to(`project:${projectId}`).emit('cursor:move', { userId, userName, position });
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      const meta = socketMeta[socket.id];
      if (meta?.projectId) {
        handleLeaveProject(meta.projectId, socket.id);
      }
      delete socketMeta[socket.id];
    });
  });
};
