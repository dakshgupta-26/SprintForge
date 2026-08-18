"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { notificationAPI } from "@/lib/api";
import { getSocket, connectSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/store/authStore";
import {
  Bell, Check, CheckCheck, Trash2, BellOff, UserPlus, Zap,
  MessageCircle, GitPullRequest, AlertCircle, Users, BellRing, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string | Date) {
  const now = Date.now();
  const diff = Math.floor((now - new Date(date).getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string; border: string }> = {
  project_invite: { icon: UserPlus,       label: "Invite",   color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  user_joined:    { icon: Users,          label: "Joined",   color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20"  },
  task_assigned:  { icon: Zap,            label: "Task",     color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  task_updated:   { icon: Zap,            label: "Task",     color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20"   },
  comment_added:  { icon: MessageCircle,  label: "Comment",  color: "text-sky-400",    bg: "bg-sky-500/10",    border: "border-sky-500/20"    },
  sprint_started: { icon: BellRing,       label: "Sprint",   color: "text-primary",    bg: "bg-primary/10",    border: "border-primary/20"    },
  pr_linked:      { icon: GitPullRequest, label: "PR",       color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  mention:        { icon: AlertCircle,    label: "Mention",  color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/20"   },
};

const getConfig = (type: string) =>
  TYPE_CONFIG[type] || { icon: Bell, label: "System", color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };

const FILTERS = ["all", "unread", "project_invite", "user_joined", "task_assigned", "comment_added"] as const;
type Filter = (typeof FILTERS)[number];

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const { data } = await notificationAPI.getAll();
      const list = Array.isArray(data.notifications) ? data.notifications : Array.isArray(data) ? data : [];
      setNotifications(list);
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Real-time ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    connectSocket(user._id);
    const s = getSocket();
    const handler = (notif: any) => {
      setNotifications((prev) => prev.some((n) => n._id === notif._id) ? prev : [notif, ...prev]);
    };
    s.on("notification:new", handler);
    return () => { s.off("notification:new", handler); };
  }, [user]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  const markRead = async (id: string) => {
    await notificationAPI.markRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All marked as read");
  };

  const deleteOne = async (id: string) => {
    await notificationAPI.delete(id).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const clearAll = async () => {
    if (!confirm("Clear all notifications? This cannot be undone.")) return;
    await Promise.all(notifications.map((n) => notificationAPI.delete(n._id).catch(() => {})));
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const handleClick = async (notif: any) => {
    if (!notif.isRead) await markRead(notif._id);
    if (notif.link) router.push(notif.link);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="text-sm bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full font-bold"
              >
                {unreadCount} new
              </motion.span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated on invites, tasks, and project activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm hover:bg-muted transition-colors font-medium">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-500/30 rounded-xl text-sm hover:bg-red-500/10 text-red-500 transition-colors font-medium">
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          )}
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        {FILTERS.map((f) => {
          const count = f === "all"
            ? notifications.length
            : f === "unread"
            ? unreadCount
            : notifications.filter((n) => n.type === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              {f.replace(/_/g, " ")} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BellOff className="w-7 h-7 text-muted-foreground opacity-40" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            {filter === "all" ? "You're all caught up!" : `No ${filter.replace(/_/g, " ")} notifications`}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {filter === "all"
              ? "Notifications about invites, tasks, and project updates will appear here."
              : "Try switching to a different filter."}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence initial={false}>
          <div className="space-y-2">
            {filtered.map((notif, i) => {
              const cfg = getConfig(notif.type);
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={notif._id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleClick(notif)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                    notif.isRead
                      ? "border-border bg-card hover:bg-muted/30"
                      : `border-primary/20 bg-primary/5 hover:bg-primary/8`
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                    cfg.bg
                  )}>
                    <Icon className={cn("w-5 h-5", cfg.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm font-semibold leading-snug",
                        notif.isRead ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 mt-0.5">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notif.message}</p>

                    {/* Type badge */}
                    <div className="mt-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border",
                        cfg.bg, cfg.color, cfg.border
                      )}>
                        <Icon className="w-2.5 h-2.5" />
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        title="Mark as read"
                        onClick={(e) => { e.stopPropagation(); markRead(notif._id); }}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); deleteOne(notif._id); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div className="absolute right-4 top-4 w-2 h-2 rounded-full bg-primary" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
