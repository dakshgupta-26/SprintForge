import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import Message from '../models/Message';
import Project from '../models/Project';
import User from '../models/User';
import Call from '../models/Call';
import Notification from '../models/Notification';
import ChatReadCursor from '../models/ChatReadCursor';
import { encryptMessage } from '../utils/crypto';

// ─── Global State & Registries ─────────────────────────────────────────────

// Track socketId → { userId, projectId, name, email, avatar }
const socketMeta: Record<
  string,
  { userId?: string; projectId?: string; name?: string; email?: string; avatar?: string }
> = {};

// Global User Socket Registry: userId → Set<socketId>
const globalUserSockets = new Map<string, Set<string>>();

// Project Presence Tracking: projectId → Map<userId, Set<socketId>>
const projectPresence = new Map<string, Map<string, Set<string>>>();

// Active Call Tracking: userId → active call metadata
const userActiveCall = new Map<
  string,
  { callId: string; projectId: string; peerId: string; role: 'caller' | 'receiver' }
>();

// callId → ring timeout timer
const callRingTimers = new Map<string, NodeJS.Timeout>();

// callId → call details
const activeCallRooms = new Map<
  string,
  {
    callerId: string;
    receiverId: string;
    projectId: string;
    type: 'audio' | 'video';
    status: string;
    startedAt: Date;
    connectedAt?: Date;
  }
>();

// Helper: Register user socket mapping
const registerUserSocket = (userId: string, socket: Socket, userMeta?: { name?: string; email?: string; avatar?: string }) => {
  if (!userId) return;
  const uid = String(userId);

  socket.join(uid);

  if (!globalUserSockets.has(uid)) {
    globalUserSockets.set(uid, new Set());
  }
  globalUserSockets.get(uid)!.add(socket.id);

  if (!socketMeta[socket.id]) {
    socketMeta[socket.id] = {};
  }
  socketMeta[socket.id].userId = uid;
  if (userMeta?.name) socketMeta[socket.id].name = userMeta.name;
  if (userMeta?.email) socketMeta[socket.id].email = userMeta.email;
  if (userMeta?.avatar) socketMeta[socket.id].avatar = userMeta.avatar;

  console.log(`[CALL/SOCKET] Registered user socket: userId=${uid}, socketId=${socket.id}, activeSockets=${globalUserSockets.get(uid)?.size}`);
};

// Helper: Unregister user socket mapping
const unregisterUserSocket = (socketId: string) => {
  const meta = socketMeta[socketId];
  const uid = meta?.userId;
  if (uid && globalUserSockets.has(uid)) {
    const sockets = globalUserSockets.get(uid)!;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      globalUserSockets.delete(uid);
    }
    console.log(`[CALL/SOCKET] Unregistered socket: userId=${uid}, socketId=${socketId}, remainingSockets=${globalUserSockets.get(uid)?.size || 0}`);
  }
};

// Helper: Check if user is online anywhere
const isUserOnline = (userId: string): boolean => {
  if (!userId) return false;
  const sockets = globalUserSockets.get(String(userId));
  return Boolean(sockets && sockets.size > 0);
};

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

      // Also check query param token
      if (!token && socket.handshake.query?.token && typeof socket.handshake.query.token === 'string') {
        token = socket.handshake.query.token;
      }

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

      // Also handle auth.userId passed directly
      const authUserId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
      if (!(socket as any).user && authUserId && typeof authUserId === 'string') {
        const fallbackUser = await User.findById(authUserId).select('name email avatar').lean();
        if (fallbackUser) {
          (socket as any).user = {
            _id: String(fallbackUser._id),
            name: fallbackUser.name,
            email: fallbackUser.email,
            avatar: fallbackUser.avatar,
          };
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
      registerUserSocket(String(authUser._id), socket, {
        name: authUser.name,
        email: authUser.email,
        avatar: authUser.avatar,
      });
    }

    // Join user's personal room for direct notifications and calls
    socket.on('join:user', async (data: string | { userId: string }) => {
      const targetUserId = typeof data === 'string' ? data : data?.userId || authUser?._id;
      if (!targetUserId) return;

      let freshMeta = authUser;
      if (!freshMeta?.name) {
        const u = await User.findById(targetUserId).select('name email avatar').lean();
        if (u) {
          freshMeta = { _id: String(u._id), name: u.name, email: u.email, avatar: u.avatar };
        }
      }

      registerUserSocket(String(targetUserId), socket, freshMeta);
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
            const isMember = (project.members as any[]).some((m) => String(m.user?._id || m.user || m) === String(effectiveUserId));

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
          readBy: [{ user: senderId, readAt: new Date() }],
          reactions: {},
        });

        const freshUser = await User.findById(senderId).select('name avatar email').lean();
        const effectiveName = freshUser?.name || senderInfo?.name || 'Team Member';
        const effectiveAvatar = freshUser?.avatar || senderInfo?.avatar || '';
        const effectiveEmail = freshUser?.email || senderInfo?.email || '';

        // 1. Broadcast to everyone in the project room
        io.to(`project:${projectId}`).emit('chat:message:receive', {
          _id: newMessage._id,
          project: projectId,
          sender: {
            _id: senderId,
            name: effectiveName,
            avatar: effectiveAvatar,
            email: effectiveEmail,
          },
          content: content || '',
          attachments: formattedAttachments,
          createdAt: newMessage.createdAt,
          reactions: {},
          readBy: [senderId],
        });

        // 2. Global Unread Notification
        try {
          const projectDoc = await Project.findById(projectId).select('name members owner isPrivate').lean();
          if (projectDoc) {
            const memberIds = new Set<string>();
            if (projectDoc.owner) memberIds.add(String(projectDoc.owner));
            (projectDoc.members || []).forEach((m: any) => {
              const uId = String(m?.user?._id || m?.user || m);
              if (uId) memberIds.add(uId);
            });

            for (const memberId of Array.from(memberIds)) {
              if (memberId !== String(senderId)) {
                io.to(memberId).emit('chat:unread_update', {
                  projectId,
                  increment: 1,
                });

                io.to(memberId).emit('chat:toast_notify', {
                  projectId,
                  projectName: projectDoc.name,
                  messageId: String(newMessage._id),
                  senderName: effectiveName,
                  senderAvatar: effectiveAvatar,
                  content: (content || '').slice(0, 100),
                  createdAt: newMessage.createdAt,
                });
              }
            }
          }
        } catch (unreadErr) {
          console.error('Error broadcasting unread/toast notification:', unreadErr);
        }
      } catch (err) {
        console.error('Failed to send encrypted chat message:', err);
      }
    });

    // Chat Reactions
    socket.on('chat:reaction', async ({ projectId, messageId, emoji, userId }) => {
      const senderId = authUser?._id || userId || socketMeta[socket.id]?.userId;
      if (!projectId || !messageId || !emoji || !senderId) return;

      try {
        const msg = await Message.findById(messageId);
        if (msg) {
          if (!msg.reactions) msg.reactions = {} as any;
          const currentList: string[] = (msg.reactions as any).get(emoji) || [];

          if (currentList.includes(senderId)) {
            const filtered = currentList.filter((id) => id !== senderId);
            if (filtered.length > 0) {
              (msg.reactions as any).set(emoji, filtered);
            } else {
              (msg.reactions as any).delete(emoji);
            }
          } else {
            (msg.reactions as any).set(emoji, [...currentList, senderId]);
          }

          await msg.save();

          io.to(`project:${projectId}`).emit('chat:reaction:update', {
            messageId,
            reactions: msg.reactions,
          });
        }
      } catch (err) {
        console.error('Error handling chat reaction:', err);
      }
    });

    // Chat Read Receipts
    socket.on('chat:read', async ({ projectId, userId, lastReadMessageId }) => {
      const effectiveUserId = authUser?._id || userId || socketMeta[socket.id]?.userId;
      if (!projectId || !effectiveUserId) return;

      try {
        await ChatReadCursor.findOneAndUpdate(
          { project: projectId, user: effectiveUserId },
          { lastReadMessage: lastReadMessageId, lastReadAt: new Date() },
          { upsert: true, new: true }
        );

        io.to(`project:${projectId}`).emit('chat:read:update', {
          projectId,
          userId: effectiveUserId,
          lastReadMessageId,
        });
      } catch (err) {
        console.error('Error updating chat read cursor:', err);
      }
    });

    // Typing Indicators
    socket.on('chat:typing:start', ({ projectId, userId, userName }) => {
      const senderId = authUser?._id || userId || socketMeta[socket.id]?.userId;
      socket.to(`project:${projectId}`).emit('chat:typing:start', { userId: senderId, userName });
    });

    socket.on('chat:typing:stop', ({ projectId, userId }) => {
      const senderId = authUser?._id || userId || socketMeta[socket.id]?.userId;
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

    // ─── WebRTC Real-Time Calling Engine ───────────────────────────────────────

    // Helper: end call safely and broadcast cleanup
    const endCallSession = async (
      callId: string,
      endedByUserId?: string,
      finalStatus: 'completed' | 'failed' | 'cancelled' | 'rejected' = 'completed'
    ) => {
      console.log(`[CALL] Ending call session: callId=${callId}, endedBy=${endedByUserId}, finalStatus=${finalStatus}`);

      // Clear ring timer if running
      if (callRingTimers.has(callId)) {
        clearTimeout(callRingTimers.get(callId)!);
        callRingTimers.delete(callId);
      }

      const callMeta = activeCallRooms.get(callId);
      activeCallRooms.delete(callId);

      let duration = 0;
      let projectId: string | undefined;

      try {
        const callDoc = await Call.findById(callId);
        if (callDoc && !['completed', 'rejected', 'missed', 'cancelled'].includes(callDoc.status)) {
          const now = new Date();
          projectId = String(callDoc.project);
          if (callDoc.connectedAt) {
            duration = Math.max(0, Math.round((now.getTime() - callDoc.connectedAt.getTime()) / 1000));
            callDoc.status = finalStatus;
          } else {
            callDoc.status = finalStatus === 'completed' ? 'cancelled' : finalStatus;
          }
          callDoc.endedAt = now;
          callDoc.duration = duration;
          await callDoc.save();
        } else if (callDoc) {
          projectId = String(callDoc.project);
          duration = callDoc.duration || 0;
        }
      } catch (err) {
        console.error('Error closing call session in DB:', err);
      }

      if (callMeta) {
        projectId = projectId || callMeta.projectId;
        userActiveCall.delete(callMeta.callerId);
        userActiveCall.delete(callMeta.receiverId);

        // Dismiss incoming call modal on all tabs of the receiver
        io.to(callMeta.receiverId).emit('call:dismiss_incoming', { callId });
        io.to(callMeta.callerId).emit('call:dismiss_incoming', { callId });
      }

      // Notify all participants in the call room
      io.to(`call:${callId}`).emit('call:ended', {
        callId,
        duration,
        endedBy: endedByUserId,
        status: finalStatus,
      });

      // Broadcast call state update to project room
      if (projectId) {
        io.to(`project:${projectId}`).emit('call:status_update', {
          callId,
          status: 'ended',
          participants: callMeta ? [callMeta.callerId, callMeta.receiverId] : [],
        });
      }
    };

    // 1. Initiate Call
    socket.on(
      'call:initiate',
      async (data: { targetUserId: string; projectId: string; type?: 'audio' | 'video' }) => {
        const callerId = authUser?._id || socketMeta[socket.id]?.userId;
        const { targetUserId, projectId, type = 'video' } = data;

        console.log(`[CALL] Incoming call:initiate request: callerId=${callerId}, targetUserId=${targetUserId}, projectId=${projectId}, type=${type}`);

        if (!callerId) {
          socket.emit('call:failed', { message: 'Authentication required to make calls' });
          return;
        }

        if (!targetUserId || !projectId) {
          socket.emit('call:failed', { message: 'Invalid call parameters' });
          return;
        }

        const cleanCallerId = String(callerId);
        const cleanTargetId = String(targetUserId);

        if (cleanCallerId === cleanTargetId) {
          socket.emit('call:failed', { message: 'Cannot call yourself' });
          return;
        }

        try {
          // Security: Verify project membership for BOTH caller and target receiver
          const project = await Project.findById(projectId).select('name key members owner isPrivate').lean();
          if (!project) {
            socket.emit('call:failed', { message: 'Project workspace not found' });
            return;
          }

          const isCallerMember =
            String(project.owner?._id || project.owner) === cleanCallerId ||
            (project.members as any[]).some((m) => String(m.user?._id || m.user || m) === cleanCallerId);

          const isTargetMember =
            String(project.owner?._id || project.owner) === cleanTargetId ||
            (project.members as any[]).some((m) => String(m.user?._id || m.user || m) === cleanTargetId);

          if (!isCallerMember || !isTargetMember) {
            socket.emit('call:failed', { message: 'Calling is restricted to members of the same workspace' });
            return;
          }

          // Check if receiver is online anywhere in SprintForge
          const targetIsOnline = isUserOnline(cleanTargetId);
          console.log(`[CALL] Target user online check: cleanTargetId=${cleanTargetId}, isOnline=${targetIsOnline}`);

          if (!targetIsOnline) {
            socket.emit('call:failed', { message: 'User is currently offline' });

            // Create missed call notification in DB for when recipient next logs in
            try {
              const callerUser = await User.findById(cleanCallerId).select('name avatar email').lean();
              await Notification.create({
                recipient: cleanTargetId,
                sender: cleanCallerId,
                type: 'call_missed',
                title: 'Missed Call',
                message: `Missed ${type} call from ${callerUser?.name || 'Team Member'} in ${project.name}`,
                link: `/dashboard/projects/${projectId}/call`,
                data: {
                  projectId,
                  projectName: project.name,
                  callType: type,
                },
              });
            } catch (notifErr) {
              console.error('Error creating offline missed call notification:', notifErr);
            }
            return;
          }

          // Check if receiver is already in an active call
          if (userActiveCall.has(cleanTargetId)) {
            socket.emit('call:busy', {
              targetUserId: cleanTargetId,
              message: 'User is currently on another call.',
            });
            return;
          }

          // Check if caller is already in another call
          if (userActiveCall.has(cleanCallerId)) {
            const existing = userActiveCall.get(cleanCallerId)!;
            await endCallSession(existing.callId, cleanCallerId, 'completed');
          }

          // Create Call record in DB
          const newCall = await Call.create({
            caller: cleanCallerId,
            receiver: cleanTargetId,
            project: projectId,
            type,
            status: 'initiated',
            startedAt: new Date(),
          });

          const callId = String(newCall._id);

          // Track in active memory
          activeCallRooms.set(callId, {
            callerId: cleanCallerId,
            receiverId: cleanTargetId,
            projectId,
            type,
            status: 'initiated',
            startedAt: new Date(),
          });

          userActiveCall.set(cleanCallerId, {
            callId,
            projectId,
            peerId: cleanTargetId,
            role: 'caller',
          });

          // Join caller socket to call room
          socket.join(`call:${callId}`);

          // Fetch fresh caller details
          const callerUser = await User.findById(cleanCallerId).select('name avatar email').lean();
          const callerMemberObj = (project.members as any[]).find(
            (m) => String(m.user?._id || m.user || m) === cleanCallerId
          );
          const callerRole = String(project.owner?._id || project.owner) === cleanCallerId ? 'Owner' : callerMemberObj?.role || 'Member';

          // Set 35-second Ring Timeout
          const ringTimer = setTimeout(async () => {
            console.log(`[CALL] Call timed out (unanswered): callId=${callId}`);
            callRingTimers.delete(callId);
            activeCallRooms.delete(callId);
            userActiveCall.delete(cleanCallerId);
            userActiveCall.delete(cleanTargetId);

            try {
              const timedOutCall = await Call.findById(callId);
              if (timedOutCall && timedOutCall.status === 'initiated') {
                timedOutCall.status = 'missed';
                timedOutCall.endedAt = new Date();
                await timedOutCall.save();

                // Create missed call notification for recipient
                const notif = await Notification.create({
                  recipient: cleanTargetId,
                  sender: cleanCallerId,
                  type: 'call_missed',
                  title: 'Missed Call',
                  message: `Missed ${type} call from ${callerUser?.name || 'Team Member'} in ${project.name}`,
                  link: `/dashboard/projects/${projectId}/call`,
                  data: {
                    callId,
                    projectId,
                    projectName: project.name,
                    callType: type,
                  },
                });

                // Notify receiver about missed call & unread badge
                io.to(cleanTargetId).emit('notification:new', notif);
                io.to(cleanTargetId).emit('call:missed_notification', {
                  callId,
                  projectId,
                  projectName: project.name,
                  caller: {
                    _id: cleanCallerId,
                    name: callerUser?.name || 'Team Member',
                    avatar: callerUser?.avatar || '',
                  },
                  type,
                  createdAt: new Date(),
                });

                io.to(cleanTargetId).emit('call:unread_update', {
                  projectId,
                  increment: 1,
                });
              }
            } catch (err) {
              console.error('Error handling ring timeout:', err);
            }

            io.to(`call:${callId}`).emit('call:missed', {
              callId,
              message: 'Call went unanswered',
            });
            io.to(cleanCallerId).emit('call:missed', { callId });
            io.to(cleanTargetId).emit('call:missed', { callId });
            io.to(cleanTargetId).emit('call:dismiss_incoming', { callId });
          }, 35000);

          callRingTimers.set(callId, ringTimer);

          const incomingPayload = {
            callId,
            projectId,
            projectName: project.name,
            projectKey: project.key,
            caller: {
              _id: cleanCallerId,
              name: callerUser?.name || 'Team Member',
              avatar: callerUser?.avatar || '',
              email: callerUser?.email || '',
              role: callerRole,
            },
            type,
            createdAt: newCall.createdAt,
          };

          // Emit incoming call payload to target user's personal room & direct sockets
          console.log(`[CALL] Emitting call:incoming to target user ${cleanTargetId}:`, incomingPayload);
          io.to(cleanTargetId).emit('call:incoming', incomingPayload);

          const targetSockets = globalUserSockets.get(cleanTargetId);
          if (targetSockets) {
            targetSockets.forEach((sId) => {
              io.to(sId).emit('call:incoming', incomingPayload);
            });
          }

          // Confirm initiation to caller
          socket.emit('call:initiated', {
            callId,
            targetUserId: cleanTargetId,
            type,
            createdAt: newCall.createdAt,
          });
        } catch (err: any) {
          console.error('[CALL] Failed to initiate call:', err);
          socket.emit('call:failed', { message: err?.message || 'Call initiation failed' });
        }
      }
    );

    // 2. Receiver Reports Ringing
    socket.on('call:ringing', async (data: { callId: string }) => {
      const { callId } = data;
      if (!callId) return;

      try {
        await Call.findByIdAndUpdate(callId, { status: 'ringing' });
        const callMeta = activeCallRooms.get(callId);
        if (callMeta) {
          callMeta.status = 'ringing';
          io.to(callMeta.callerId).emit('call:ringing', { callId });
          io.to(`call:${callId}`).emit('call:ringing', { callId });
        }
      } catch (err) {
        console.error('Error updating ringing state:', err);
      }
    });

    // 3. Accept Call
    socket.on('call:accept', async (data: { callId: string }) => {
      const { callId } = data;
      const receiverId = authUser?._id || socketMeta[socket.id]?.userId;
      console.log(`[CALL] call:accept received: callId=${callId}, receiverId=${receiverId}`);

      if (!callId || !receiverId) return;

      // Clear ring timer
      if (callRingTimers.has(callId)) {
        clearTimeout(callRingTimers.get(callId)!);
        callRingTimers.delete(callId);
      }

      try {
        const callDoc = await Call.findById(callId);
        if (!callDoc || !['initiated', 'ringing'].includes(callDoc.status)) {
          socket.emit('call:failed', { message: 'Call is no longer available' });
          return;
        }

        callDoc.status = 'accepted';
        await callDoc.save();

        const callerId = String(callDoc.caller);
        const projectId = String(callDoc.project);

        socket.join(`call:${callId}`);

        userActiveCall.set(String(receiverId), {
          callId,
          projectId,
          peerId: callerId,
          role: 'receiver',
        });

        const callMeta = activeCallRooms.get(callId);
        if (callMeta) {
          callMeta.status = 'accepted';
        }

        const acceptedPayload = {
          callId,
          projectId,
          callerId,
          receiverId: String(receiverId),
          type: callDoc.type,
        };

        // Notify both participants that call is accepted
        console.log(`[CALL] Emitting call:accepted:`, acceptedPayload);
        io.to(`call:${callId}`).emit('call:accepted', acceptedPayload);
        io.to(callerId).emit('call:accepted', acceptedPayload);
        io.to(String(receiverId)).emit('call:accepted', acceptedPayload);

        // Dismiss incoming call modal on any other open tabs of the receiver
        io.to(String(receiverId)).emit('call:dismiss_incoming', { callId });

        // Broadcast to project that users are in a call
        io.to(`project:${projectId}`).emit('call:user_status_changed', {
          users: [callerId, String(receiverId)],
          status: 'in_call',
          callId,
        });
      } catch (err) {
        console.error('[CALL] Error accepting call:', err);
        socket.emit('call:failed', { message: 'Failed to accept call' });
      }
    });

    // 4. Reject Call
    socket.on('call:reject', async (data: { callId: string; reason?: string }) => {
      const { callId, reason } = data;
      const receiverId = authUser?._id || socketMeta[socket.id]?.userId;
      console.log(`[CALL] call:reject received: callId=${callId}, receiverId=${receiverId}`);

      if (!callId) return;

      const callMeta = activeCallRooms.get(callId);
      await endCallSession(callId, receiverId, 'rejected');

      if (callMeta) {
        io.to(callMeta.callerId).emit('call:rejected', {
          callId,
          reason: reason || 'Call was declined by receiver',
        });
        io.to(`call:${callId}`).emit('call:rejected', {
          callId,
          reason: reason || 'Call was declined by receiver',
        });
        io.to(callMeta.receiverId).emit('call:dismiss_incoming', { callId });
      }
    });

    // 5. Cancel Call (Caller cancels before answer)
    socket.on('call:cancel', async (data: { callId: string }) => {
      const { callId } = data;
      const callerId = authUser?._id || socketMeta[socket.id]?.userId;
      console.log(`[CALL] call:cancel received: callId=${callId}, callerId=${callerId}`);

      if (!callId) return;

      const callMeta = activeCallRooms.get(callId);
      await endCallSession(callId, callerId, 'cancelled');

      if (callMeta) {
        io.to(callMeta.receiverId).emit('call:cancelled', {
          callId,
          message: 'Caller cancelled the call',
        });
        io.to(`call:${callId}`).emit('call:cancelled', {
          callId,
          message: 'Caller cancelled the call',
        });
        io.to(callMeta.receiverId).emit('call:dismiss_incoming', { callId });
      }
    });

    // 6. WebRTC Signaling Relays (Pure P2P SDP Offer / Answer / ICE Candidates)
    socket.on('call:offer', (data: { callId: string; sdp: any }) => {
      const { callId, sdp } = data;
      const senderId = authUser?._id || socketMeta[socket.id]?.userId;
      if (!callId || !sdp) return;

      console.log(`[CALL/WEBRTC] Relaying offer for callId=${callId} from senderId=${senderId}`);
      socket.to(`call:${callId}`).emit('call:offer', {
        callId,
        sdp,
        senderId,
      });

      const callMeta = activeCallRooms.get(callId);
      if (callMeta) {
        io.to(callMeta.receiverId).emit('call:offer', { callId, sdp, senderId });
      }
    });

    socket.on('call:answer', (data: { callId: string; sdp: any }) => {
      const { callId, sdp } = data;
      const senderId = authUser?._id || socketMeta[socket.id]?.userId;
      if (!callId || !sdp) return;

      console.log(`[CALL/WEBRTC] Relaying answer for callId=${callId} from senderId=${senderId}`);
      socket.to(`call:${callId}`).emit('call:answer', {
        callId,
        sdp,
        senderId,
      });

      const callMeta = activeCallRooms.get(callId);
      if (callMeta) {
        io.to(callMeta.callerId).emit('call:answer', { callId, sdp, senderId });
      }
    });

    socket.on('call:ice-candidate', (data: { callId: string; candidate: any }) => {
      const { callId, candidate } = data;
      const senderId = authUser?._id || socketMeta[socket.id]?.userId;
      if (!callId || !candidate) return;

      socket.to(`call:${callId}`).emit('call:ice-candidate', {
        callId,
        candidate,
        senderId,
      });

      const callMeta = activeCallRooms.get(callId);
      if (callMeta) {
        const peerId = String(senderId) === String(callMeta.callerId) ? callMeta.receiverId : callMeta.callerId;
        io.to(peerId).emit('call:ice-candidate', { callId, candidate, senderId });
      }
    });

    // 7. WebRTC Connected Confirmation
    socket.on('call:connected', async (data: { callId: string }) => {
      const { callId } = data;
      if (!callId) return;

      try {
        const now = new Date();
        const callDoc = await Call.findById(callId);
        if (callDoc && !callDoc.connectedAt) {
          callDoc.status = 'connected';
          callDoc.connectedAt = now;
          await callDoc.save();
        }

        const callMeta = activeCallRooms.get(callId);
        if (callMeta) {
          callMeta.status = 'connected';
          callMeta.connectedAt = now;
        }

        console.log(`[CALL/WEBRTC] Call marked connected: callId=${callId}`);
      } catch (err) {
        console.error('Error recording call connection:', err);
      }
    });

    // 8. Track State Sync (Mute / Cam / Screen / Speaking)
    socket.on(
      'call:track-state',
      (data: {
        callId: string;
        isMuted?: boolean;
        isVideoOff?: boolean;
        isScreenSharing?: boolean;
        isSpeaking?: boolean;
      }) => {
        const { callId, isMuted, isVideoOff, isScreenSharing, isSpeaking } = data;
        const senderId = authUser?._id || socketMeta[socket.id]?.userId;
        if (!callId) return;

        socket.to(`call:${callId}`).emit('call:track-state', {
          callId,
          senderId,
          isMuted,
          isVideoOff,
          isScreenSharing,
          isSpeaking,
        });

        const callMeta = activeCallRooms.get(callId);
        if (callMeta) {
          const peerId = String(senderId) === String(callMeta.callerId) ? callMeta.receiverId : callMeta.callerId;
          io.to(peerId).emit('call:track-state', {
            callId,
            senderId,
            isMuted,
            isVideoOff,
            isScreenSharing,
            isSpeaking,
          });
        }
      }
    );

    // 9. End Call
    socket.on('call:end', async (data: { callId: string }) => {
      const { callId } = data;
      const userId = authUser?._id || socketMeta[socket.id]?.userId;
      if (!callId) return;

      await endCallSession(callId, userId, 'completed');
    });

    // Disconnect cleanup
    socket.on('disconnect', async () => {
      const meta = socketMeta[socket.id];
      const userId = meta?.userId;

      console.log(`[CALL/SOCKET] Socket disconnected: socketId=${socket.id}, userId=${userId}`);

      // If user was in an active call, terminate call gracefully
      if (userId && userActiveCall.has(userId)) {
        const activeCall = userActiveCall.get(userId)!;
        await endCallSession(activeCall.callId, userId, 'completed');
      }

      if (meta?.projectId) {
        handleLeaveProject(meta.projectId, socket.id);
      }

      unregisterUserSocket(socket.id);
      delete socketMeta[socket.id];
    });
  });
};
