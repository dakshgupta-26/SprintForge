import { io, Socket } from "socket.io-client";

/**
 * Production-grade WebSocket / Socket.IO Server URL Resolution.
 * Always resolves to the dedicated persistent backend (Render / custom socket host)
 * and never accidentally points to Vercel serverless / window.location.origin.
 */
export const getSocketUrl = (): string => {
  const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  // 1. Explicit Socket URL configured in environment
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

  // 2. Explicit API URL configured in environment
  if (
    envApiUrl &&
    (envApiUrl.startsWith("https://") || envApiUrl.startsWith("wss://") || envApiUrl.startsWith("http://")) &&
    !envApiUrl.includes("localhost") &&
    !envApiUrl.includes("127.0.0.1")
  ) {
    return envApiUrl.replace(/\/api\/?$/, "");
  }

  // 3. Browser running in production / public HTTPS (e.g. Vercel)
  if (typeof window !== "undefined") {
    const isPublicOrigin =
      window.location.protocol === "https:" ||
      (!window.location.hostname.includes("localhost") &&
        !window.location.hostname.includes("127.0.0.1") &&
        !window.location.hostname.includes("0.0.0.0"));

    if (isPublicOrigin) {
      // Backend is deployed on Render
      return "https://sprintforge-btpl.onrender.com";
    }
  }

  // 4. Local Development Fallback
  return envSocketUrl || (envApiUrl ? envApiUrl.replace(/\/api\/?$/, "") : "http://localhost:5000");
};

let socket: Socket | null = null;
let currentRegisteredUserId: string | null = null;
let currentAuthToken: string | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const targetUrl = getSocketUrl();
    if (process.env.NODE_ENV !== "production") {
      console.log(`[REALTIME] Initializing Socket.IO connection to: ${targetUrl}`);
    }

    socket = io(targetUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true, // Send HttpOnly auth cookies with socket handshake
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: (cb) => {
        cb({
          userId: currentRegisteredUserId,
          token: currentAuthToken,
        });
      },
    });

    socket.on("connect", () => {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[REALTIME] ✅ Socket connected: socketId=${socket?.id}, userId=${currentRegisteredUserId}`);
      }
      if (currentRegisteredUserId) {
        socket?.emit("join:user", currentRegisteredUserId);
      }
    });

    socket.on("connect_error", (error) => {
      console.warn(`[REALTIME] ⚠️ Socket connection error:`, error.message);
    });

    socket.on("reconnect", (attempt) => {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[REALTIME] 🔄 Socket reconnected on attempt ${attempt}: socketId=${socket?.id}`);
      }
      if (currentRegisteredUserId) {
        socket?.emit("join:user", currentRegisteredUserId);
      }
    });

    socket.on("disconnect", (reason) => {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[REALTIME] ❌ Socket disconnected: reason=${reason}`);
      }
    });
  }
  return socket;
};

/**
 * Connects socket with authenticated user ID and optional token.
 */
export const connectSocket = (userId: string, token?: string): Socket => {
  currentRegisteredUserId = userId;
  if (token) currentAuthToken = token;

  const s = getSocket();
  s.auth = {
    userId: currentRegisteredUserId,
    token: currentAuthToken,
  };

  if (!s.connected) {
    s.connect();
  } else {
    s.emit("join:user", userId);
  }

  return s;
};

/**
 * Helper: Ensures socket is connected before sending crucial real-time events.
 * Returns a promise that resolves with the connected socket or rejects on timeout.
 */
export const ensureSocketConnected = (timeoutMs: number = 8000): Promise<Socket> => {
  const s = getSocket();
  if (s.connected) {
    return Promise.resolve(s);
  }

  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;

    const onConnect = () => {
      if (timer) clearTimeout(timer);
      s.off("connect_error", onError);
      if (currentRegisteredUserId) {
        s.emit("join:user", currentRegisteredUserId);
      }
      resolve(s);
    };

    const onError = (err: any) => {
      // Keep waiting until timer expires
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[REALTIME] Waiting for socket connection... (${err?.message})`);
      }
    };

    timer = setTimeout(() => {
      s.off("connect", onConnect);
      s.off("connect_error", onError);
      if (s.connected) {
        resolve(s);
      } else {
        reject(new Error("Signaling socket connection timeout. Check network or server status."));
      }
    }, timeoutMs);

    s.once("connect", onConnect);
    s.on("connect_error", onError);

    s.connect();
  });
};

export const disconnectSocket = () => {
  currentRegisteredUserId = null;
  currentAuthToken = null;
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


