"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Settings,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  FolderKanban,
  X,
} from "lucide-react";
import { notificationAPI } from "@/lib/api";
import { getSocket, connectSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { cn } from "@/lib/utils";
import { NotificationCard, NotificationItem } from "@/components/notifications/NotificationCard";
import { NotificationActivitySummary } from "@/components/notifications/NotificationActivitySummary";
import { NotificationContextSidebar } from "@/components/notifications/NotificationContextSidebar";
import { NotificationEmptyState } from "@/components/notifications/NotificationEmptyState";
import { NotificationSettingsModal } from "@/components/notifications/NotificationSettingsModal";
import toast from "react-hot-toast";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "mentions", label: "Mentions" },
  { id: "tasks", label: "Tasks" },
  { id: "projects", label: "Projects & Invites" },
  { id: "issues", label: "Issues" },
  { id: "comments", label: "Comments" },
  { id: "sprints", label: "Sprints" },
] as const;

type FilterType = (typeof FILTERS)[number]["id"];

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { fetchProjects } = useProjectStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ── Load Notifications from API ──
  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await notificationAPI.getAll();
      const list = Array.isArray(data.notifications)
        ? data.notifications
        : Array.isArray(data)
        ? data
        : [];
      setNotifications(list);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ── Real-Time Socket.IO Synchronization ──
  useEffect(() => {
    if (!user) return;
    connectSocket(user._id);
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (newNotif: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === newNotif._id)) return prev;
        return [newNotif, ...prev];
      });
      toast(`New notification: ${newNotif.title}`, {
        icon: "🔔",
        duration: 3000,
      });
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification", handleNewNotification);
    };
  }, [user]);

  // ── Unread Counts and Metrics ──
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const taskCount = useMemo(() => {
    return notifications.filter(
      (n) => n.type.startsWith("task_") || n.type.startsWith("sprint_")
    ).length;
  }, [notifications]);

  const mentionCount = useMemo(() => {
    return notifications.filter((n) => n.type === "mention").length;
  }, [notifications]);

  const inviteCount = useMemo(() => {
    return notifications.filter(
      (n) => n.type === "project_invite" || n.type === "user_joined"
    ).length;
  }, [notifications]);

  const issueCount = useMemo(() => {
    return notifications.filter(
      (n) => n.type === "issue_created" || n.type === "bug"
    ).length;
  }, [notifications]);

  const commentCount = useMemo(() => {
    return notifications.filter((n) => n.type === "comment_added").length;
  }, [notifications]);

  const sprintCount = useMemo(() => {
    return notifications.filter((n) => n.type.startsWith("sprint_")).length;
  }, [notifications]);

  // ── Filtered & Searched Notifications ──
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // 1. Search query filter
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const titleMatch = notif.title?.toLowerCase().includes(q);
        const msgMatch = notif.message?.toLowerCase().includes(q);
        const senderMatch = notif.sender?.name?.toLowerCase().includes(q);
        const projMatch = notif.data?.projectName?.toLowerCase().includes(q);
        const taskKeyMatch = notif.data?.taskKey?.toLowerCase().includes(q);
        if (!titleMatch && !msgMatch && !senderMatch && !projMatch && !taskKeyMatch) {
          return false;
        }
      }

      // 2. Filter Category
      if (activeFilter === "all") return true;
      if (activeFilter === "unread") return !notif.isRead;
      if (activeFilter === "mentions") return notif.type === "mention";
      if (activeFilter === "tasks")
        return notif.type.startsWith("task_") || notif.type === "task_status_changed";
      if (activeFilter === "projects")
        return notif.type === "project_invite" || notif.type === "user_joined";
      if (activeFilter === "issues") return notif.type.startsWith("issue_");
      if (activeFilter === "comments") return notif.type === "comment_added";
      if (activeFilter === "sprints") return notif.type.startsWith("sprint_");

      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  // ── Time Grouping (Today, Yesterday, This Week, Earlier) ──
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {
      TODAY: [],
      YESTERDAY: [],
      "THIS WEEK": [],
      EARLIER: [],
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

    filteredNotifications.forEach((notif) => {
      const time = new Date(notif.createdAt).getTime();
      if (time >= todayStart) {
        groups.TODAY.push(notif);
      } else if (time >= yesterdayStart) {
        groups.YESTERDAY.push(notif);
      } else if (time >= weekStart) {
        groups["THIS WEEK"].push(notif);
      } else {
        groups.EARLIER.push(notif);
      }
    });

    return groups;
  }, [filteredNotifications]);

  // ── Actions ──
  const handleMarkRead = async (id: string) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error("Failed to update notification");
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read! ✨");
    } catch {
      toast.error("Failed to mark notifications read");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationAPI.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification removed");
    } catch {
      toast.error("Failed to remove notification");
    }
  };

  const handleClearRead = async () => {
    const readItems = notifications.filter((n) => n.isRead);
    if (readItems.length === 0) {
      toast("No read notifications to clear", { icon: "ℹ️" });
      return;
    }
    try {
      await Promise.all(readItems.map((n) => notificationAPI.delete(n._id)));
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success("Cleared all read notifications");
    } catch {
      toast.error("Failed to clear notifications");
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-6 pb-16">
      {/* ── 1. Full-Width Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-md flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 ? (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 animate-pulse">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 rounded-full">
                  All caught up
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Stay on top of tasks, projects, mentions, and team activity across your workspace
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.16] text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            title="Notification Preferences"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Preferences</span>
          </button>

          {notifications.some((n) => n.isRead) && (
            <button
              onClick={handleClearRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.02] hover:bg-rose-500/10 border border-white/[0.06] hover:border-rose-500/30 text-slate-400 hover:text-rose-400 text-xs font-medium transition-all cursor-pointer"
              title="Clear all read items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear read</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* ── 2. Full-Width Activity Metric Strip ── */}
      <NotificationActivitySummary
        total={notifications.length}
        unread={unreadCount}
        taskCount={taskCount}
        mentionCount={mentionCount}
        inviteCount={inviteCount}
      />

      {/* ── 3. Search Bar + Smart Filter Chips (Full Width) ── */}
      <div className="w-full space-y-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications by person, work item, project, or keyword..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[#090d1f] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-500 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips Bar */}
        <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
          {FILTERS.map((f) => {
            const count =
              f.id === "all"
                ? notifications.length
                : f.id === "unread"
                ? unreadCount
                : f.id === "mentions"
                ? mentionCount
                : f.id === "tasks"
                ? taskCount
                : f.id === "projects"
                ? inviteCount
                : f.id === "issues"
                ? issueCount
                : f.id === "comments"
                ? commentCount
                : sprintCount;

            const isSelected = activeFilter === f.id;

            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  isSelected
                    ? "bg-violet-600 text-white shadow-[0_0_16px_rgba(124,92,255,0.4)] font-bold"
                    : "bg-[#090d1f] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <span>{f.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-white/[0.04] text-slate-400"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Main 2-Column Responsive Workspace Grid ── */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Notification Feed (8 columns on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-[#090d1f] border border-white/[0.06] animate-pulse p-4 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-white/[0.04] rounded" />
                    <div className="h-3 w-72 bg-white/[0.02] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <NotificationEmptyState filter={activeFilter} />
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([timeGroup, items]) => {
                if (items.length === 0) return null;

                return (
                  <div key={timeGroup} className="space-y-3">
                    {/* Time Group Header */}
                    <div className="flex items-center gap-2.5 px-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        {timeGroup}
                      </span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <span className="text-[10px] font-mono text-slate-500">
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </span>
                    </div>

                    {/* Notification Cards */}
                    <div className="space-y-2.5">
                      <AnimatePresence initial={false}>
                        {items.map((notif) => (
                          <NotificationCard
                            key={notif._id}
                            notification={notif}
                            onMarkRead={handleMarkRead}
                            onDelete={handleDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Workspace Context Sidebar (4 columns on desktop) */}
        <div className="lg:col-span-4 sticky top-20">
          <NotificationContextSidebar
            total={notifications.length}
            unread={unreadCount}
            taskCount={taskCount}
            mentionCount={mentionCount}
            inviteCount={inviteCount}
            issueCount={issueCount}
            onOpenPreferences={() => setIsSettingsOpen(true)}
            onMarkAllRead={handleMarkAllRead}
          />
        </div>
      </div>

      {/* ── 5. Notification Preferences Modal ── */}
      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
