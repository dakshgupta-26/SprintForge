import { Server, Socket } from 'socket.io';
import Message from '../models/Message';
import { encryptMessage } from '../utils/crypto';

// Track socketId → { userId, projectId } for presence on disconnect
const socketMeta: Record<string, { userId?: string; projectId?: string }> = {};

export const initSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    socketMeta[socket.id] = {};

    // Join user's personal room for notifications
    socket.on('join:user', (userId: string) => {
      socket.join(userId);
      socketMeta[socket.id].userId = userId;
      console.log(`User ${userId} joined their room`);
    });

    // Join project room — broadcast presence to others
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      socketMeta[socket.id].projectId = projectId;
      console.log(`Socket joined project room: ${projectId}`);

      socket.to(`project:${projectId}`).emit('presence:joined', {
        userId: socketMeta[socket.id].userId,
        projectId,
      });
    });

    // Leave project room — broadcast presence to others
    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('presence:left', {
        userId: socketMeta[socket.id].userId,
        projectId,
      });
      socketMeta[socket.id].projectId = undefined;
    });

    // ─── Project Chat Rooms ───
    socket.on('chat:message', async (data: { projectId: string, sender: any, content: string }) => {
      const { projectId, sender, content } = data;
      try {
        // Encrypt message content before saving it
        const { iv, encryptedData } = encryptMessage(content);
        
        const newMessage = await Message.create({
          project: projectId,
          sender: sender._id,
          content: encryptedData,
          iv,
        });

        // Broadcast to everyone in the project room including sender for quick confirmation
        // But Usually, clients optimistically render. For simplicity, we just broadcast to project room.
        io.to(`project:${projectId}`).emit('chat:message:receive', {
          _id: newMessage._id,
          project: projectId,
          sender: sender, // the populated sender passed from client
          content: content, // send raw content over socket (TLS secured)
          createdAt: newMessage.createdAt,
          updatedAt: newMessage.updatedAt,
        });
      } catch (err) {
        console.error('Failed to save encrypted message:', err);
      }
    });

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

    // Typing indicator in task comments
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

    // On disconnect — broadcast presence:left to the project room
    socket.on('disconnect', () => {
      const meta = socketMeta[socket.id];
      if (meta?.projectId && meta?.userId) {
        socket.to(`project:${meta.projectId}`).emit('presence:left', {
          userId: meta.userId,
          projectId: meta.projectId,
        });
      }
      delete socketMeta[socket.id];
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

