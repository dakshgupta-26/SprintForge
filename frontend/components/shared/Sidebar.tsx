"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Columns3,
  AlignLeft,
  Zap,
  Bug,
  MessageSquare,
  BarChart3,
  Users,
  BookOpen,
  Bell,
  Settings,
  ChevronDown,
  Plus,
  Layers,
  FolderKanban,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  Command,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore, Project } from "@/lib/store/projectStore";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { useChatUnreadStore } from "@/lib/store/chatUnreadStore";
import { notificationAPI, taskAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { cn, generateAvatar } from "@/lib/utils";
import { SprintForgeLogo } from "@/components/shared/SprintForgeLogo";
import { WorkspaceSwitcher } from "@/components/sidebar/WorkspaceSwitcher";
import { SidebarUserMenu } from "@/components/sidebar/SidebarUserMenu";
import { SidebarTooltip } from "@/components/sidebar/SidebarTooltip";
import { QuickCreatePopover } from "@/components/sidebar/QuickCreatePopover";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  shortcut?: string;
  pulse?: boolean;
}

const mainNav = (taskCount: number, notifCount: number): NavItem[] => [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    shortcut: "G D",
  },
  {
    label: "My Tasks",
    href: "/dashboard/tasks",
    icon: AlignLeft,
    badge: taskCount,
    shortcut: "G M",
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    badge: notifCount,
    shortcut: "G N",
  },
];

const projectNav = (id: string, chatUnread = 0, isPulsing = false): NavItem[] => [
  { label: "Board", href: `/dashboard/projects/${id}/board`, icon: Columns3 },
  { label: "Backlog", href: `/dashboard/projects/${id}/backlog`, icon: AlignLeft },
  { label: "Sprints", href: `/dashboard/projects/${id}/sprints`, icon: Zap },
  { label: "Issues", href: `/dashboard/projects/${id}/issues`, icon: Bug },
  {
    label: "Chat",
    href: `/dashboard/projects/${id}/chat`,
    icon: MessageSquare,
    badge: chatUnread,
    pulse: isPulsing,
  },
  { label: "Analytics", href: `/dashboard/projects/${id}/analytics`, icon: BarChart3 },
  { label: "Team", href: `/dashboard/projects/${id}/team`, icon: Users },
  { label: "Wiki", href: `/dashboard/projects/${id}/wiki`, icon: BookOpen },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { projects, currentProject, fetchProjects } = useProjectStore();
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const { projectUnreadCounts, pulseProjects } = useChatUnreadStore();

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [assignedTasksCount, setAssignedTasksCount] = useState(0);

  // ── Extract active project ID from current URL route ──
  const activeProjectIdFromUrl = useMemo(() => {
    const match = pathname.match(/\/dashboard\/projects\/([a-f0-9]{24})/i);
    return match ? match[1] : null;
  }, [pathname]);

  // ── Keep active project expanded ──
  useEffect(() => {
    if (activeProjectIdFromUrl) {
      setExpandedProjects((prev) => ({
        ...prev,
        [activeProjectIdFromUrl]: true,
      }));
    } else if (projects.length > 0 && Object.keys(expandedProjects).length === 0) {
      setExpandedProjects({ [projects[0]._id]: true });
    }
  }, [activeProjectIdFromUrl, projects]);

  // ── Fetch dynamic badge counters (Notifications & Tasks) ──
  const loadBadgeCounters = useCallback(async () => {
    if (!user?._id) return;
    try {
      // 1. Unread notifications
      const { data: notifData } = await notificationAPI.getAll();
      const notifList = Array.isArray(notifData.notifications)
        ? notifData.notifications
        : Array.isArray(notifData)
        ? notifData
        : [];
      setUnreadNotifs(notifList.filter((n: any) => !n.isRead).length);

      // 2. Assigned tasks count (active only)
      const { data: taskData } = await taskAPI.getAll({ assignee: user._id });
      const taskList = Array.isArray(taskData) ? taskData : [];
      setAssignedTasksCount(taskList.filter((t: any) => t.status !== "done").length);
    } catch {}
  }, [user?._id]);

  useEffect(() => {
    loadBadgeCounters();
  }, [loadBadgeCounters]);

  // ── Real-time Socket.IO Listeners ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleProjectUpdate = () => {
      fetchProjects();
      loadBadgeCounters();
    };

    const handleNotifUpdate = () => {
      loadBadgeCounters();
    };

    socket.on("project:updated", handleProjectUpdate);
    socket.on("member:joined", handleProjectUpdate);
    socket.on("notification:new", handleNotifUpdate);
    socket.on("notification", handleNotifUpdate);
    socket.on("task:created", handleNotifUpdate);
    socket.on("task:updated", handleNotifUpdate);
    socket.on("task:status_changed", handleNotifUpdate);

    return () => {
      socket.off("project:updated", handleProjectUpdate);
      socket.off("member:joined", handleProjectUpdate);
      socket.off("notification:new", handleNotifUpdate);
      socket.off("notification", handleNotifUpdate);
      socket.off("task:created", handleNotifUpdate);
      socket.off("task:updated", handleNotifUpdate);
      socket.off("task:status_changed", handleNotifUpdate);
    };
  }, [fetchProjects, loadBadgeCounters]);

  const toggleProject = (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={cn(
        "sidebar shadow-2xl transition-all duration-200 select-none",
        isCollapsed && "collapsed",
        isOpen && "open"
      )}
    >
      {/* ── 1. Top Brand Header ── */}
      <div className="h-16 px-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0 bg-[#070b1a]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between w-full">
            <SprintForgeLogo href="/dashboard" size="sm" />
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Collapse sidebar (Ctrl + [)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-violet-400" />
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Workspace Selector ── */}
      <WorkspaceSwitcher
        isCollapsed={isCollapsed}
        activeProjectId={activeProjectIdFromUrl}
        onCloseMobile={onClose}
      />

      {/* ── 3. Quick Command Bar Shortcut (when expanded) ── */}
      {!isCollapsed && (
        <div className="px-3.5 py-1">
          <button
            type="button"
            onClick={() => {
              // Trigger command palette or global search
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Search or jump to...</span>
            </div>
            <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] border border-white/[0.08] text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* ── 4. Main Navigation Scroll Area ── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4 scrollbar-thin">
        {/* General Nav */}
        <div>
          {!isCollapsed && (
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1 px-2.5">
              General
            </p>
          )}
          <div className="space-y-0.5">
            {mainNav(assignedTasksCount, unreadNotifs).map((item) => (
              <SidebarTooltip
                key={item.href}
                content={item.label}
                badge={item.badge}
                shortcut={item.shortcut}
                show={isCollapsed}
              >
                <NavLink
                  item={item}
                  isActive={isActive(item.href)}
                  isCollapsed={isCollapsed}
                  onClick={onClose}
                />
              </SidebarTooltip>
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <span>Projects</span>
              <div className="flex items-center gap-1">
                <QuickCreatePopover isCollapsed={false} onCloseMobile={onClose} />
                <Link
                  href="/dashboard/projects/new"
                  onClick={onClose}
                  className="p-1 hover:bg-white/[0.06] text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Create new project"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {isCollapsed ? (
            /* Collapsed Mode Projects List */
            <div className="space-y-1 pt-1 flex flex-col items-center">
              {projects.map((project) => {
                const isCurrentProject =
                  activeProjectIdFromUrl === project._id ||
                  currentProject?._id === project._id;
                const unreadCount = projectUnreadCounts[project._id] || 0;

                return (
                  <SidebarTooltip
                    key={project._id}
                    content={`${project.name} (${project.key})${
                      unreadCount > 0 ? ` • ${unreadCount > 99 ? "99+" : unreadCount} unread` : ""
                    }`}
                    show={true}
                  >
                    <div className="relative">
                      <Link
                        href={`/dashboard/projects/${project._id}/board`}
                        onClick={onClose}
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-all",
                          isCurrentProject
                            ? "ring-2 ring-violet-500 shadow-md text-white"
                            : "opacity-75 hover:opacity-100 hover:scale-105 text-white"
                        )}
                        style={{ backgroundColor: project.color || "#6366f1" }}
                      >
                        {project.key?.charAt(0) || "P"}
                      </Link>

                      {/* Collapsed Project Unread Indicator Dot */}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-violet-500 border-2 border-[#070b1a] text-[9px] font-mono font-bold text-white flex items-center justify-center shadow-[0_0_8px_rgba(139,92,246,0.9)] animate-pulse">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                  </SidebarTooltip>
                );
              })}
            </div>
          ) : (
            /* Expanded Mode Projects Tree */
            <div className="space-y-1 pt-0.5">
              {projects.map((project) => {
                const isExpanded = !!expandedProjects[project._id];
                const isCurrentRouteInsideProject =
                  activeProjectIdFromUrl === project._id ||
                  currentProject?._id === project._id;
                const projectUnread = projectUnreadCounts[project._id] || 0;
                const isPulsing = !!pulseProjects[project._id];

                return (
                  <div key={project._id} className="space-y-0.5">
                    {/* Project Header Row */}
                    <div
                      className={cn(
                        "group flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all text-xs font-semibold cursor-pointer",
                        isCurrentRouteInsideProject
                          ? "bg-violet-600/15 text-white"
                          : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                      )}
                      onClick={() => toggleProject(project._id)}
                    >
                      <Link
                        href={`/dashboard/projects/${project._id}/board`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedProjects((prev) => ({
                            ...prev,
                            [project._id]: true,
                          }));
                          onClose?.();
                        }}
                        className="flex items-center gap-2 min-w-0 flex-1"
                      >
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold text-white flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: project.color || "#6366f1" }}
                        >
                          {project.key?.charAt(0) || "P"}
                        </div>
                        <span className="truncate">{project.name}</span>
                      </Link>

                      {/* Project Header Unread Badge (when collapsed) */}
                      {!isExpanded && projectUnread > 0 && (
                        <span className="mr-1.5 bg-violet-600/30 border border-violet-500/40 text-violet-200 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                          {projectUnread > 99 ? "99+" : projectUnread}
                        </span>
                      )}

                      {/* Expand / Collapse Chevron */}
                      <button
                        type="button"
                        onClick={(e) => toggleProject(project._id, e)}
                        className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title={isExpanded ? "Collapse project" : "Expand project"}
                      >
                        <ChevronDown
                          className={cn(
                            "w-3.5 h-3.5 transition-transform duration-200",
                            !isExpanded && "-rotate-90"
                          )}
                        />
                      </button>
                    </div>

                    {/* Project Sub-navigation when Expanded */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="overflow-hidden ml-3.5 pl-2.5 border-l border-white/[0.08] space-y-0.5 py-0.5"
                        >
                          {projectNav(project._id, projectUnread, isPulsing).map((item) => {
                            const active = isActive(item.href);
                            return (
                              <NavLink
                                key={item.href}
                                item={item}
                                isActive={active}
                                isCollapsed={false}
                                small
                                onClick={onClose}
                              />
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {projects.length === 0 && (
                <div className="p-3 text-center rounded-xl bg-white/[0.02] border border-dashed border-white/[0.06]">
                  <p className="text-[11px] text-slate-500">No projects yet</p>
                  <Link
                    href="/dashboard/projects/new"
                    onClick={onClose}
                    className="text-xs text-violet-400 hover:underline font-bold mt-1 inline-block"
                  >
                    + Create workspace
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ── 5. User Profile Footer ── */}
      <SidebarUserMenu isCollapsed={isCollapsed} onCloseMobile={onClose} />
    </aside>
  );
}

function NavLink({
  item,
  isActive,
  isCollapsed,
  small = false,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  small?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-label={item.badge && item.badge > 0 ? `${item.label}, ${item.badge} unread` : item.label}
      className={cn(
        "flex items-center gap-2.5 rounded-xl transition-all duration-150 group relative font-medium",
        isCollapsed
          ? "w-10 h-10 mx-auto justify-center p-0"
          : small
          ? "px-2.5 py-1.5 text-xs"
          : "px-2.5 py-2 text-xs sm:text-sm",
        isActive
          ? "bg-violet-600/15 text-violet-300 font-bold border border-violet-500/30 shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
      )}
    >
      {/* Active Left Indicator Bar */}
      {isActive && !isCollapsed && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-violet-500 rounded-r-full"
        />
      )}

      {/* Icon */}
      <Icon
        className={cn(
          "flex-shrink-0 transition-transform",
          small ? "w-3.5 h-3.5" : "w-4 h-4",
          isActive
            ? "text-violet-400 scale-105"
            : "text-slate-500 group-hover:text-slate-300"
        )}
      />

      {/* Text Label & Badge (when expanded) */}
      {!isCollapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <motion.span
              initial={false}
              animate={
                item.pulse
                  ? {
                      scale: [1, 1.28, 1],
                      boxShadow: [
                        "0 0 0px rgba(139,92,246,0)",
                        "0 0 14px rgba(139,92,246,0.85)",
                        "0 0 0px rgba(139,92,246,0)",
                      ],
                    }
                  : { scale: 1 }
              }
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="ml-auto bg-violet-600/30 border border-violet-500/40 text-violet-200 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shadow-sm min-w-[20px] text-center"
            >
              {item.badge > 99 ? "99+" : item.badge}
            </motion.span>
          )}
        </>
      )}

      {/* Mini Badge Dot (when collapsed) */}
      {isCollapsed && item.badge !== undefined && item.badge > 0 && (
        <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-violet-500 ring-2 ring-[#070b1a] shadow-[0_0_8px_rgba(139,92,246,0.9)] animate-pulse" />
      )}
    </Link>
  );
}
