import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socket;
};

export const connectSocket = (userId: string) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.emit("join:user", userId);
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};

export const joinProject = (projectId: string) => {
  getSocket().emit("join:project", projectId);
};

export const leaveProject = (projectId: string) => {
  getSocket().emit("leave:project", projectId);
};

export const joinTask = (taskId: string) => {
  getSocket().emit("join:task", taskId);
};

export default getSocket;
