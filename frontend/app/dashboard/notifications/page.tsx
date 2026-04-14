"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { notificationAPI } from "@/lib/api";
import { Bell, Check, CheckCheck, Trash2, MessageCircle, Zap, UserPlus, GitPullRequest, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const NOTIF_ICONS: Record<string, any> = {
  task_assigned: Zap,
  comment_added: MessageCircle,
  project_invite: UserPlus,
  pr_linked: GitPullRequest,
  mention: AlertCircle,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {} finally { setIsLoading(false); }
  };

  const markRead = async (id: string) => {
    await notificationAPI.markRead(id);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success("All marked as read");
  };

  const deleteNotif = async (id: string) => {
    await notificationAPI.delete(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Notifications
            {unreadCount > 0 && (
              <span className="text-sm bg-primary text-white px-2 py-0.5 rounded-full">{unreadCount} new</span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">You're all caught up!</p>
          <p className="text-xs text-muted-foreground mt-1">Notifications about your tasks and projects will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = NOTIF_ICONS[notif.type] || Bell;
            return (
              <motion.div key={notif._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className={cn("flex items-start gap-3 p-4 rounded-2xl border transition-all",
                  notif.isRead ? "border-border bg-card" : "border-primary/20 bg-primary/5")}>
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                  notif.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", notif.isRead ? "text-muted-foreground" : "text-foreground")}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.createdAt, "relative")}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notif.isRead && (
                    <button onClick={() => markRead(notif._id)}
                      className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteNotif(notif._id)}
                    className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
