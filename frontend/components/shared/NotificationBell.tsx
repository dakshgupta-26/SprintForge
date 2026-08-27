"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, Check, CheckCheck, Trash2, X, UserPlus, Zap,
  MessageCircle, GitPullRequest, AlertCircle, Users,
  BellRing, ArrowRight,
} from "lucide-react";
import { notificationAPI } from "@/lib/api";
import { getSocket, connectSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string | Date): string {
  const now = Date.now();
  const diff = Math.floor((now - new Date(date).getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  project_invite: { icon: UserPlus,      color: "text-violet-400", bg: "bg-violet-500/10" },
  user_joined:    { icon: Users,         color: "text-green-400",  bg: "bg-green-500/10"  },
  task_assigned:  { icon: Zap,           color: "text-yellow-400", bg: "bg-yellow-500/10" },
  task_updated:   { icon: Zap,           color: "text-blue-400",   bg: "bg-blue-500/10"   },
  comment_added:  { icon: MessageCircle, color: "text-sky-400",    bg: "bg-sky-500/10"    },
  sprint_started: { icon: BellRing,      color: "text-primary",    bg: "bg-primary/10"    },
  pr_linked:      { icon: GitPullRequest,color: "text-orange-400", bg: "bg-orange-500/10" },
  mention:        { icon: AlertCircle,   color: "text-pink-400",   bg: "bg-pink-500/10"   },
};

const getConfig = (type: string) =>
  TYPE_CONFIG[type] || { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Fetch from API ──────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationAPI.getAll();
      const list = Array.isArray(data.notifications)
        ? data.notifications
        : Array.isArray(data)
        ? data
        : [];
      setNotifications(list);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  // ── Real-time socket ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    connectSocket(user._id);
    const s = getSocket();

    const handleNew = (notif: any) => {
      setNotifications((prev) => {
        // Avoid duplicates
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });

      // Rich toast notification
      const cfg = getConfig(notif.type);
      toast.custom(
        (t) => (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "flex items-start gap-3 max-w-sm w-full bg-card border border-border rounded-2xl shadow-2xl p-4 cursor-pointer",
              t.visible ? "pointer-events-auto" : "pointer-events-none"
            )}
            onClick={() => {
              toast.dismiss(t.id);
              if (notif.link) router.push(notif.link);
            }}
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
              <cfg.icon className={cn("w-4 h-4", cfg.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{notif.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ),
        { duration: 5000, position: "top-right" }
      );
    };

    s.on("notification:new", handleNew);
    return () => { s.off("notification:new", handleNew); };
  }, [user, router]);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const markRead = async (id: string) => {
    await notificationAPI.markRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationAPI.delete(id).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const clearAll = async () => {
    await Promise.all(notifications.map((n) => notificationAPI.delete(n._id).catch(() => {})));
    setNotifications([]);
    setOpen(false);
    toast.success("All notifications cleared");
  };

  const handleNotifClick = async (notif: any) => {
    if (!notif.isRead) await markRead(notif._id);
    setOpen(false);
    if (notif.link) router.push(notif.link);
  };

  return (
    <div ref={panelRef} className="relative">
      {/* ── Bell button ── */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unreadCount > 0) fetchNotifications();
        }}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className={cn("w-4 h-4", unreadCount > 0 && "text-primary")} />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Dropdown panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            style={{ maxHeight: "calc(100vh - 80px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3 h-3" /> All read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
                    title="Clear all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
              {loading ? (
                <div className="space-y-1 p-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl skeleton" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">You're all caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Notifications about your projects will appear here.
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map((notif) => {
                    const cfg = getConfig(notif.type);
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={notif._id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => handleNotifClick(notif)}
                        className={cn(
                          "w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all group relative cursor-pointer",
                          notif.isRead
                            ? "hover:bg-muted/60"
                            : "bg-primary/5 border border-primary/10 hover:bg-primary/10"
                        )}
                      >
                        {/* Icon */}
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                          <Icon className={cn("w-4 h-4", cfg.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-semibold leading-tight", notif.isRead ? "text-muted-foreground" : "text-foreground")}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.isRead && (
                            <button
                              type="button"
                              title="Mark as read"
                              onClick={(e) => { e.stopPropagation(); markRead(notif._id); }}
                              className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Delete"
                            onClick={(e) => deleteOne(notif._id, e)}
                            className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Unread dot */}
                        {!notif.isRead && (
                          <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border p-2">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 text-xs text-primary font-medium hover:underline w-full"
                >
                  View all notifications <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
