"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const initSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        // Join user's personal room for notifications
        socket.on('join:user', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        });
        // Join project room for real-time board updates
        socket.on('join:project', (projectId) => {
            socket.join(`project:${projectId}`);
            console.log(`Socket joined project room: ${projectId}`);
        });
        // Join task room for real-time comments
        socket.on('join:task', (taskId) => {
            socket.join(`task:${taskId}`);
        });
        socket.on('leave:project', (projectId) => {
            socket.leave(`project:${projectId}`);
        });
        // Broadcast typing indicator in task comments
        socket.on('typing:start', ({ taskId, userId, userName }) => {
            socket.to(`task:${taskId}`).emit('typing:start', { userId, userName });
        });
        socket.on('typing:stop', ({ taskId, userId }) => {
            socket.to(`task:${taskId}`).emit('typing:stop', { userId });
        });
        // Broadcast board cursor position (collaborative)
        socket.on('cursor:move', ({ projectId, userId, userName, position }) => {
            socket.to(`project:${projectId}`).emit('cursor:move', { userId, userName, position });
        });
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
};
exports.initSocket = initSocket;
//# sourceMappingURL=index.js.map