"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { getSocket } from "@/lib/socket";
import { cn, generateAvatar } from "@/lib/utils";
import { SprintForgeLogo } from "@/components/shared/SprintForgeLogo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Tasks", href: "/dashboard/tasks", icon: AlignLeft },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
];

const projectNav = (id: string): NavItem[] => [
  { label: "Board", href: `/dashboard/projects/${id}/board`, icon: Columns3 },
  { label: "Backlog", href: `/dashboard/projects/${id}/backlog`, icon: AlignLeft },
  { label: "Sprints", href: `/dashboard/projects/${id}/sprints`, icon: Zap },
  { label: "Issues", href: `/dashboard/projects/${id}/issues`, icon: Bug },
  { label: "Chat", href: `/dashboard/projects/${id}/chat`, icon: MessageSquare },
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
  const { user } = useAuthStore();
  const { projects, currentProject, fetchProjects } = useProjectStore();

  const [projectsSectionOpen, setProjectsSectionOpen] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

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
      // By default expand the first project if nothing is selected
      setExpandedProjects({ [projects[0]._id]: true });
    }
  }, [activeProjectIdFromUrl, projects]);

  // ── Real-time Socket Listener to keep project list fresh ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleProjectUpdate = () => {
      fetchProjects();
    };

    socket.on("project:updated", handleProjectUpdate);
    socket.on("member:joined", handleProjectUpdate);

    return () => {
      socket.off("project:updated", handleProjectUpdate);
      socket.off("member:joined", handleProjectUpdate);
    };
  }, [fetchProjects]);

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
    <aside className={cn("sidebar", isOpen && "open")}>
      {/* Logo */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <SprintForgeLogo href="/dashboard" size="sm" />
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {/* ── GENERAL NAV ── */}
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1 px-2">
            General
          </p>
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onClick={onClose}
              />
            ))}
          </div>
        </div>

        {/* ── PROJECTS SECTION ── */}
        <div>
          <div className="flex items-center justify-between px-2 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            <button
              onClick={() => setProjectsSectionOpen(!projectsSectionOpen)}
              className="flex items-center gap-1.5 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <span>Projects</span>
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform duration-200",
                  !projectsSectionOpen && "-rotate-90"
                )}
              />
            </button>
            <Link
              href="/dashboard/projects/new"
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              className="p-1 hover:bg-white/[0.06] text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Create new project"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          <AnimatePresence initial={false}>
            {projectsSectionOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="overflow-hidden space-y-1 pt-1"
              >
                {projects.map((project) => {
                  const isExpanded = !!expandedProjects[project._id];
                  const isCurrentRouteInsideProject =
                    activeProjectIdFromUrl === project._id ||
                    currentProject?._id === project._id;

                  return (
                    <div key={project._id} className="space-y-0.5">
                      {/* Project Header Row */}
                      <div
                        className={cn(
                          "group flex items-center justify-between px-2 py-1.5 rounded-xl transition-all text-xs font-semibold cursor-pointer",
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
                            setExpandedProjects((prev) => ({ ...prev, [project._id]: true }));
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
                            {projectNav(project._id).map((item) => {
                              const active = isActive(item.href);
                              return (
                                <NavLink
                                  key={item.href}
                                  item={item}
                                  isActive={active}
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
                      + Create one
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-white/[0.06] bg-[#070b1a]">
        <Link
          href="/dashboard/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] transition-colors group"
        >
          <img
            src={user?.avatar || generateAvatar(user?.name || "U")}
            alt=""
            className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-white/[0.1] group-hover:ring-violet-500/50 transition-all"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || "Member"}</p>
            <p className="text-[10px] font-mono text-slate-400 truncate capitalize">
              {user?.role || "Developer"}
            </p>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
        </Link>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  isActive,
  small = false,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  small?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-2.5 rounded-xl transition-all duration-150 group relative font-medium",
        small ? "py-1.5 text-xs" : "py-2 text-xs sm:text-sm",
        isActive
          ? "bg-violet-600/15 text-violet-300 font-bold border border-violet-500/30"
          : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-violet-500 rounded-r-full"
        />
      )}
      <Icon
        className={cn(
          "flex-shrink-0",
          small ? "w-3.5 h-3.5" : "w-4 h-4",
          isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"
        )}
      />
      <span className="truncate">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto bg-violet-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}
