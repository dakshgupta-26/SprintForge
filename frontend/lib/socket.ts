import { io, Socket } from "socket.io-client";

/**
 * Safely resolves the WebSocket server URL.
 * Never attempts localhost socket handshakes from a public HTTPS domain.
 */
export const getSocketUrl = (): string => {
  const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window !== "undefined") {
    const isPublicOrigin =
      window.location.protocol === "https:" ||
      (!window.location.hostname.includes("localhost") &&
        !window.location.hostname.includes("127.0.0.1") &&
        !window.location.hostname.includes("0.0.0.0"));

    if (isPublicOrigin) {
      if (
        envSocketUrl &&
        (envSocketUrl.startsWith("https://") ||
          envSocketUrl.startsWith("wss://") ||
          envSocketUrl.startsWith("http://")) &&
        !envSocketUrl.includes("localhost") &&
        !envSocketUrl.includes("127.0.0.1")
      ) {
        return envSocketUrl;
      }
      if (
        envApiUrl &&
        (envApiUrl.startsWith("https://") || envApiUrl.startsWith("wss://")) &&
        !envApiUrl.includes("localhost") &&
        !envApiUrl.includes("127.0.0.1")
      ) {
        return envApiUrl.replace(/\/api\/?$/, "");
      }
      return window.location.origin;
    }
  }

  return envSocketUrl || (envApiUrl ? envApiUrl.replace(/\/api\/?$/, "") : "http://localhost:5000");
};

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const targetUrl = getSocketUrl();
    socket = io(targetUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true, // Send HttpOnly auth cookies with socket handshake
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
  if (socket?.connected) {
    socket.disconnect();
  }
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
