import { create } from "zustand";
import { chatAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export interface ChatToastItem {
  id: string; // unique toast id or deduplication key: `${projectId}-${senderId}`
  projectId: string;
  projectName: string;
  projectKey?: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  messageCount: number;
  latestTimestamp: Date;
  autoDismissTimeout?: NodeJS.Timeout;
}

export interface ChatNotificationPreferences {
  inApp: boolean;
  browser: boolean;
  sound: boolean;
}

interface ChatUnreadState {
  totalUnread: number;
  projectUnreadCounts: Record<string, number>;
  activeProjectId: string | null;
  toasts: ChatToastItem[];
  preferences: ChatNotificationPreferences;
  isInitialized: boolean;
  pulseProjects: Record<string, boolean>; // Flags for pulse animation when count increases

  // Actions
  initialize: (userId: string) => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;
  setActiveProjectId: (projectId: string | null) => void;
  markProjectAsRead: (projectId: string, lastReadMessageId?: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  updatePreferences: (prefs: Partial<ChatNotificationPreferences>) => void;
  requestBrowserNotificationPermission: () => Promise<NotificationPermission>;
}

// ─── Web Audio API Sound Synthesizer ──────────────────────────────────────────
export const playChatNotificationSound = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Soft two-tone frequency chime
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch {}
};

// ─── Deduplication Cache & BroadcastChannel ───────────────────────────────────
const processedMessageIds = new Set<string>();
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel("sprintforge_chat_unread_channel");
  } catch {}
}

export const useChatUnreadStore = create<ChatUnreadState>((set, get) => ({
  totalUnread: 0,
  projectUnreadCounts: {},
  activeProjectId: null,
  toasts: [],
  preferences: {
    inApp: true,
    browser: true,
    sound: true,
  },
  isInitialized: false,
  pulseProjects: {},

  initialize: async (userId: string) => {
    if (get().isInitialized) return;

    // 1. Load persisted preferences from localStorage
    if (typeof window !== "undefined") {
      const savedPrefs = localStorage.getItem("sf_chat_notif_prefs");
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          set({ preferences: { ...get().preferences, ...parsed } });
        } catch {}
      }
    }

    // 2. Fetch initial unread counts from backend
    await get().fetchUnreadCounts();
    set({ isInitialized: true });

    // 3. Socket.IO Listeners for realtime messages & read sync
    const socket = getSocket();
    if (socket) {
      // Direct recipient notification event
      const handleNewNotification = (data: {
        projectId: string;
        projectName: string;
        projectKey?: string;
        messageId: string;
        sender: { _id: string; name: string; avatar?: string };
        createdAt: string | Date;
      }) => {
        const { projectId, projectName, projectKey, messageId, sender, createdAt } = data;

        // Ignore if sent by self
        if (sender?._id === userId) return;

        // Deduplication check
        if (messageId && processedMessageIds.has(messageId)) return;
        if (messageId) {
          processedMessageIds.add(messageId);
          // Keep set small
          if (processedMessageIds.size > 200) {
            const first = processedMessageIds.values().next().value;
            if (first) processedMessageIds.delete(first);
          }
        }

        const state = get();
        const isCurrentActive =
          state.activeProjectId === projectId &&
          typeof document !== "undefined" &&
          document.visibilityState === "visible";

        if (isCurrentActive) {
          // Message was received while active inside that conversation — automatically mark read
          get().markProjectAsRead(projectId, messageId);
          return;
        }

        // Increment project unread count
        const currentCount = state.projectUnreadCounts[projectId] || 0;
        const newProjectCounts = {
          ...state.projectUnreadCounts,
          [projectId]: currentCount + 1,
        };
        const newTotal = Object.values(newProjectCounts).reduce((acc, c) => acc + c, 0);

        // Trigger pulse on badge
        const pulse = { ...state.pulseProjects, [projectId]: true };
        set({
          projectUnreadCounts: newProjectCounts,
          totalUnread: newTotal,
          pulseProjects: pulse,
        });

        setTimeout(() => {
          set((s) => {
            const nextPulse = { ...s.pulseProjects };
            delete nextPulse[projectId];
            return { pulseProjects: nextPulse };
          });
        }, 1200);

        // Sound Notification
        if (state.preferences.sound) {
          playChatNotificationSound();
        }

        // Browser Notification (when window is backgrounded / hidden)
        if (
          state.preferences.browser &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          document.visibilityState === "hidden"
        ) {
          try {
            new Notification(`SprintForge — ${sender.name || "Team Member"}`, {
              body: `Sent a message in ${projectName || "Project Chat"}`,
              icon: "/favicon.ico",
              tag: `chat-${projectId}`,
            });
          } catch {}
        }

        // In-App Toast (grouped by project)
        if (state.preferences.inApp) {
          const toastKey = `${projectId}-${sender._id}`;
          const existingToast = state.toasts.find((t) => t.id === toastKey);

          if (existingToast) {
            set((s) => ({
              toasts: s.toasts.map((t) =>
                t.id === toastKey
                  ? {
                      ...t,
                      messageCount: t.messageCount + 1,
                      latestTimestamp: new Date(createdAt || Date.now()),
                    }
                  : t
              ),
            }));
          } else {
            const newToast: ChatToastItem = {
              id: toastKey,
              projectId,
              projectName: projectName || "Project Chat",
              projectKey,
              sender,
              messageCount: 1,
              latestTimestamp: new Date(createdAt || Date.now()),
            };

            set((s) => ({
              toasts: [newToast, ...s.toasts.filter((t) => t.id !== toastKey)].slice(0, 4),
            }));
          }
        }
      };

      // Realtime unread increment counter
      const handleUnreadUpdate = ({ projectId, increment = 1 }: { projectId: string; increment?: number }) => {
        const state = get();
        if (state.activeProjectId === projectId && document.visibilityState === "visible") return;

        const currentCount = state.projectUnreadCounts[projectId] || 0;
        const newProjectCounts = {
          ...state.projectUnreadCounts,
          [projectId]: currentCount + increment,
        };
        const newTotal = Object.values(newProjectCounts).reduce((acc, c) => acc + c, 0);

        set({
          projectUnreadCounts: newProjectCounts,
          totalUnread: newTotal,
        });
      };

      // Realtime cross-tab & multi-device read sync
      const handleReadSync = ({
        all,
        projectId,
        unreadCount = 0,
      }: {
        all?: boolean;
        projectId?: string;
        unreadCount?: number;
      }) => {
        if (all) {
          set({
            totalUnread: 0,
            projectUnreadCounts: {},
            toasts: [],
          });
        } else if (projectId) {
          const newCounts = {
            ...get().projectUnreadCounts,
            [projectId]: unreadCount,
          };
          const newTotal = Object.values(newCounts).reduce((acc, c) => acc + c, 0);
          set({
            projectUnreadCounts: newCounts,
            totalUnread: newTotal,
            toasts: get().toasts.filter((t) => t.projectId !== projectId),
          });
        }
      };

      socket.on("chat:new_message_notification", handleNewNotification);
      socket.on("chat:unread:update", handleUnreadUpdate);
      socket.on("chat:read_state:sync", handleReadSync);
    }

    // 4. Multi-tab BroadcastChannel listener
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        const { type, projectId } = event.data || {};
        if (type === "READ_PROJECT" && projectId) {
          const newCounts: Record<string, number> = {
            ...get().projectUnreadCounts,
            [projectId]: 0,
          };
          set({
            projectUnreadCounts: newCounts,
            totalUnread: Object.values(newCounts).reduce((acc: number, c: number) => acc + (Number(c) || 0), 0),
            toasts: get().toasts.filter((t) => t.projectId !== projectId),
          });
        } else if (type === "READ_ALL") {
          set({
            totalUnread: 0,
            projectUnreadCounts: {},
            toasts: [],
          });
        }
      };
    }
  },

  fetchUnreadCounts: async () => {
    try {
      const { data } = await chatAPI.getUnreadCounts();
      if (data) {
        set({
          totalUnread: data.totalUnread || 0,
          projectUnreadCounts: data.projects || {},
        });
      }
    } catch {}
  },

  setActiveProjectId: (projectId: string | null) => {
    set({ activeProjectId: projectId });
    if (projectId) {
      // Clear toasts for this project
      set((s) => ({
        toasts: s.toasts.filter((t) => t.projectId !== projectId),
      }));
      // Mark as read
      get().markProjectAsRead(projectId);
    }
  },

  markProjectAsRead: async (projectId: string, lastReadMessageId?: string) => {
    if (!projectId) return;

    // Optimistic UI update
    const previousCount = get().projectUnreadCounts[projectId] || 0;
    const newProjectCounts = {
      ...get().projectUnreadCounts,
      [projectId]: 0,
    };
    const newTotal = Object.values(newProjectCounts).reduce((acc, c) => acc + c, 0);

    set({
      projectUnreadCounts: newProjectCounts,
      totalUnread: newTotal,
      toasts: get().toasts.filter((t) => t.projectId !== projectId),
    });

    // Broadcast to other open tabs
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: "READ_PROJECT", projectId });
      } catch {}
    }

    try {
      await chatAPI.markAsRead(projectId, lastReadMessageId);
    } catch {
      // Rollback on server error
      if (previousCount > 0) {
        set((s) => ({
          projectUnreadCounts: { ...s.projectUnreadCounts, [projectId]: previousCount },
          totalUnread: s.totalUnread + previousCount,
        }));
      }
    }
  },

  markAllAsRead: async () => {
    // Optimistic UI update
    set({
      totalUnread: 0,
      projectUnreadCounts: {},
      toasts: [],
    });

    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: "READ_ALL" });
      } catch {}
    }

    try {
      await chatAPI.markAllAsRead();
    } catch {
      get().fetchUnreadCounts();
    }
  },

  dismissToast: (id: string) => {
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },

  updatePreferences: (prefs: Partial<ChatNotificationPreferences>) => {
    set((s) => {
      const next = { ...s.preferences, ...prefs };
      if (typeof window !== "undefined") {
        localStorage.setItem("sf_chat_notif_prefs", JSON.stringify(next));
      }
      return { preferences: next };
    });
  },

  requestBrowserNotificationPermission: async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied" as NotificationPermission;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      get().updatePreferences({ browser: true });
    } else {
      get().updatePreferences({ browser: false });
    }
    return permission;
  },
}));
