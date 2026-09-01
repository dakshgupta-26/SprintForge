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

// Track socketId → { userId, projectId, name, email, avatar }
const socketMeta: Record<
  string,
  { userId?: string; projectId?: string; name?: string; email?: string; avatar?: string }
> = {};

// Project Presence Tracking: projectId → Map<userId, Set<socketId>>
const projectPresence = new Map<string, Map<string, Set<string>>>();

// Active Call Tracking
// userId → active call metadata
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
                name: effectiveName,
                avatar: effectiveAvatar,
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

    // ─── WebRTC Real-Time Calling Engine ───────────────────────────────────────

    // Helper: end call safely and broadcast cleanup
    const endCallSession = async (
      callId: string,
      endedByUserId?: string,
      finalStatus: 'completed' | 'failed' | 'cancelled' | 'rejected' = 'completed'
    ) => {
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

        if (!callerId) {
          socket.emit('call:failed', { message: 'Authentication required to make calls' });
          return;
        }

        if (!targetUserId || !projectId) {
          socket.emit('call:failed', { message: 'Invalid call parameters' });
          return;
        }

        if (String(callerId) === String(targetUserId)) {
          socket.emit('call:failed', { message: 'Cannot call yourself' });
          return;
        }

        try {
          // Security: Verify project membership for BOTH caller and target receiver
          const project = await Project.findById(projectId).select('name key members owner isPrivate').lean();
          if (!project) {
            socket.emit('call:failed', { message: 'Project not found' });
            return;
          }

          const isCallerMember =
            String(project.owner) === String(callerId) ||
            (project.members as any[]).some((m) => String(m.user?._id || m.user || m) === String(callerId));

          const isTargetMember =
            String(project.owner) === String(targetUserId) ||
            (project.members as any[]).some((m) => String(m.user?._id || m.user || m) === String(targetUserId));

          if (!isCallerMember || !isTargetMember) {
            socket.emit('call:failed', { message: 'Calling is restricted to members of the same project' });
            return;
          }

          // Check if receiver is online in project
          const onlineUsers = getOnlineUsersInProject(projectId);
          if (!onlineUsers.includes(String(targetUserId))) {
            socket.emit('call:failed', { message: 'User is currently offline' });
            return;
          }

          // Check if receiver is already in an active call
          if (userActiveCall.has(String(targetUserId))) {
            socket.emit('call:busy', {
              targetUserId,
              message: 'User is currently on another call.',
            });
            return;
          }

          // Check if caller is already in another call
          if (userActiveCall.has(String(callerId))) {
            const existing = userActiveCall.get(String(callerId))!;
            await endCallSession(existing.callId, callerId, 'completed');
          }

          // Create Call record in DB
          const newCall = await Call.create({
            caller: callerId,
            receiver: targetUserId,
            project: projectId,
            type,
            status: 'initiated',
            startedAt: new Date(),
          });

          const callId = String(newCall._id);

          // Track in active memory
          activeCallRooms.set(callId, {
            callerId: String(callerId),
            receiverId: String(targetUserId),
            projectId,
            type,
            status: 'initiated',
            startedAt: new Date(),
          });

          userActiveCall.set(String(callerId), {
            callId,
            projectId,
            peerId: String(targetUserId),
            role: 'caller',
          });

          // Join caller to call room
          socket.join(`call:${callId}`);

          // Fetch fresh caller details
          const callerUser = await User.findById(callerId).select('name avatar email').lean();
          const callerMemberObj = (project.members as any[]).find(
            (m) => String(m.user?._id || m.user || m) === String(callerId)
          );
          const callerRole = String(project.owner) === String(callerId) ? 'Owner' : callerMemberObj?.role || 'Member';

          // Set 35-second Ring Timeout
          const ringTimer = setTimeout(async () => {
            callRingTimers.delete(callId);
            activeCallRooms.delete(callId);
            userActiveCall.delete(String(callerId));
            userActiveCall.delete(String(targetUserId));

            try {
              const timedOutCall = await Call.findById(callId);
              if (timedOutCall && timedOutCall.status === 'initiated') {
                timedOutCall.status = 'missed';
                timedOutCall.endedAt = new Date();
                await timedOutCall.save();

                // Create missed call notification for recipient
                const notif = await Notification.create({
                  recipient: targetUserId,
                  sender: callerId,
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
                io.to(String(targetUserId)).emit('notification:new', notif);
                io.to(String(targetUserId)).emit('call:missed_notification', {
                  callId,
                  projectId,
                  projectName: project.name,
                  caller: {
                    _id: String(callerId),
                    name: callerUser?.name || 'Team Member',
                    avatar: callerUser?.avatar || '',
                  },
                  type,
                  createdAt: new Date(),
                });

                io.to(String(targetUserId)).emit('call:unread_update', {
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
            io.to(String(callerId)).emit('call:missed', { callId });
            io.to(String(targetUserId)).emit('call:missed', { callId });
          }, 35000);

          callRingTimers.set(callId, ringTimer);

          // Emit incoming call payload to target user's personal room
          io.to(String(targetUserId)).emit('call:incoming', {
            callId,
            projectId,
            projectName: project.name,
            projectKey: project.key,
            caller: {
              _id: String(callerId),
              name: callerUser?.name || 'Team Member',
              avatar: callerUser?.avatar || '',
              email: callerUser?.email || '',
              role: callerRole,
            },
            type,
            createdAt: newCall.createdAt,
          });

          // Confirm initiation to caller
          socket.emit('call:initiated', {
            callId,
            targetUserId,
            type,
            createdAt: newCall.createdAt,
          });
        } catch (err: any) {
          console.error('Failed to initiate call:', err);
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
        }
      } catch (err) {
        console.error('Error updating ringing state:', err);
      }
    });

    // 3. Accept Call
    socket.on('call:accept', async (data: { callId: string }) => {
      const { callId } = data;
      const receiverId = authUser?._id || socketMeta[socket.id]?.userId;
      if (!callId || !receiverId) return;

      // Clear ring timer
      if (callRingTimers.has(callId)) {
        clearTimeout(callRingTimers.get(callId)!);
        callRingTimers.delete(callId);
      }

      try {
        const callDoc = await Call.findById(callId);
        if (!callDoc || callDoc.status !== 'initiated') {
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

        // Notify both participants that call is accepted
        io.to(`call:${callId}`).emit('call:accepted', {
          callId,
          projectId,
          callerId,
          receiverId: String(receiverId),
          type: callDoc.type,
        });

        // Broadcast to project that users are in a call
        io.to(`project:${projectId}`).emit('call:user_status_changed', {
          users: [callerId, String(receiverId)],
          status: 'in_call',
          callId,
        });
      } catch (err) {
        console.error('Error accepting call:', err);
        socket.emit('call:failed', { message: 'Failed to accept call' });
      }
    });

    // 4. Reject Call
    socket.on('call:reject', async (data: { callId: string; reason?: string }) => {
      const { callId, reason } = data;
      const receiverId = authUser?._id || socketMeta[socket.id]?.userId;
      if (!callId) return;

      await endCallSession(callId, receiverId, 'rejected');

      const callMeta = activeCallRooms.get(callId);
      if (callMeta) {
        io.to(callMeta.callerId).emit('call:rejected', {
          callId,
          reason: reason || 'Call was declined by receiver',
        });
      }
    });

    // 5. Cancel Call (Caller cancels before answer)
    socket.on('call:cancel', async (data: { callId: string }) => {
      const { callId } = data;
      const callerId = authUser?._id || socketMeta[socket.id]?.userId;
      if (!callId) return;

      const callMeta = activeCallRooms.get(callId);
      await endCallSession(callId, callerId, 'cancelled');

      if (callMeta) {
        io.to(callMeta.receiverId).emit('call:cancelled', {
          callId,
          message: 'Caller cancelled the call',
        });
      }
    });

    // 6. WebRTC Signaling Relays (Pure P2P SDP Offer / Answer / ICE Candidates)
    socket.on('call:offer', (data: { callId: string; sdp: any }) => {
      const { callId, sdp } = data;
      const senderId = authUser?._id || socketMeta[socket.id]?.userId;
      if (!callId || !sdp) return;

      socket.to(`call:${callId}`).emit('call:offer', {
        callId,
        sdp,
        senderId,
      });
    });

    socket.on('call:answer', (data: { callId: string; sdp: any }) => {
      const { callId, sdp } = data;
      const senderId = authUser?._id || socketMeta[socket.id]?.userId;
      if (!callId || !sdp) return;

      socket.to(`call:${callId}`).emit('call:answer', {
        callId,
        sdp,
        senderId,
      });
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
          callMeta.connectedAt = callMeta.connectedAt || now;
        }

        io.to(`call:${callId}`).emit('call:connected', {
          callId,
          connectedAt: now,
        });
      } catch (err) {
        console.error('Error updating connected call status:', err);
      }
    });

    // 8. Track State Sync (Mute / Camera / Screen share status)
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

      // If user was in an active call, terminate call gracefully
      if (userId && userActiveCall.has(userId)) {
        const activeCall = userActiveCall.get(userId)!;
        await endCallSession(activeCall.callId, userId, 'completed');
      }

      if (meta?.projectId) {
        handleLeaveProject(meta.projectId, socket.id);
      }
      delete socketMeta[socket.id];
    });
  });
};

