"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowLeft,
  FolderKanban,
  Zap,
  Columns3,
  AlignLeft,
  LayoutDashboard,
  Users,
  Settings,
  User,
  Bell,
  Plus,
  ArrowRight,
  Sun,
  Moon,
  MessageSquare,
  Bug,
  BookOpen,
  BarChart3,
  Hash,
  X,
  Command,
} from "lucide-react";
import { useProjectStore } from "@/lib/store/projectStore";
import { useAuthStore } from "@/lib/store/authStore";
import { useTheme } from "next-themes";

interface AppCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
}

export function AppCommandPalette({
  isOpen,
  onClose,
  onOpenNewTask,
  onOpenNewProject,
}: AppCommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { projects } = useProjectStore();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract current project ID if inside one
  const segments = pathname.split("/").filter(Boolean);
  const projectIdx = segments.indexOf("projects");
  const currentProjectId =
    projectIdx !== -1 && segments[projectIdx + 1]?.match(/^[0-9a-f]{24}$/i)
      ? segments[projectIdx + 1]
      : null;

  const currentProject = useMemo(() => {
    return projects.find((p) => p._id === currentProjectId) || null;
  }, [projects, currentProjectId]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // Robust Global Key listener (Escape + Cmd/Ctrl+K) using capture phase
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [isOpen, onClose]);

  // Build searchable items
  const items = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      category: "Navigation" | "Projects" | "Project Views" | "Actions";
      icon: any;
      color?: string;
      subtitle?: string;
      badge?: string;
      action: () => void;
    }> = [];

    // 1. Actions
    list.push({
      id: "action-new-task",
      title: "Create New Task",
      subtitle: "Add a new task to your active sprint or backlog",
      category: "Actions",
      icon: Plus,
      badge: "Action",
      action: () => {
        onClose();
        onOpenNewTask();
      },
    });

    list.push({
      id: "action-new-project",
      title: "Create New Project",
      subtitle: "Initialize a new Agile workspace",
      category: "Actions",
      icon: FolderKanban,
      badge: "Action",
      action: () => {
        onClose();
        onOpenNewProject();
      },
    });

    list.push({
      id: "action-toggle-theme",
      title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      subtitle: "Change application appearance",
      category: "Actions",
      icon: theme === "dark" ? Sun : Moon,
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        onClose();
      },
    });

    // 2. Project Views (if inside a project)
    if (currentProject) {
      const pid = currentProject._id;
      list.push(
        {
          id: `view-board-${pid}`,
          title: `${currentProject.name} — Board`,
          subtitle: `Active Kanban/Scrum Board for ${currentProject.key}`,
          category: "Project Views",
          icon: Columns3,
          action: () => {
            router.push(`/dashboard/projects/${pid}/board`);
            onClose();
          },
        },
        {
          id: `view-backlog-${pid}`,
          title: `${currentProject.name} — Backlog`,
          subtitle: `Prioritize and plan sprints for ${currentProject.key}`,
          category: "Project Views",
          icon: AlignLeft,
          action: () => {
            router.push(`/dashboard/projects/${pid}/backlog`);
            onClose();
          },
        },
        {
          id: `view-sprints-${pid}`,
          title: `${currentProject.name} — Sprints`,
          subtitle: `Sprint management and velocity tracking`,
          category: "Project Views",
          icon: Zap,
          action: () => {
            router.push(`/dashboard/projects/${pid}/sprints`);
            onClose();
          },
        },
        {
          id: `view-chat-${pid}`,
          title: `${currentProject.name} — Team Chat`,
          subtitle: `Realtime project discussion room`,
          category: "Project Views",
          icon: MessageSquare,
          action: () => {
            router.push(`/dashboard/projects/${pid}/chat`);
            onClose();
          },
        },
        {
          id: `view-analytics-${pid}`,
          title: `${currentProject.name} — Analytics`,
          subtitle: `Burndown, velocity, and completion metrics`,
          category: "Project Views",
          icon: BarChart3,
          action: () => {
            router.push(`/dashboard/projects/${pid}/analytics`);
            onClose();
          },
        }
      );
    }

    // 3. Projects
    projects.forEach((proj) => {
      list.push({
        id: `project-${proj._id}`,
        title: proj.name,
        subtitle: `${proj.key} • ${proj.type.toUpperCase()} • ${
          proj.members?.length || 1
        } members`,
        category: "Projects",
        icon: FolderKanban,
        color: proj.color,
        badge: proj.key,
        action: () => {
          router.push(`/dashboard/projects/${proj._id}/board`);
          onClose();
        },
      });
    });

    // 4. Navigation
    list.push(
      {
        id: "nav-dashboard",
        title: "Dashboard Overview",
        subtitle: "Global sprint activity, assigned tasks, and quick actions",
        category: "Navigation",
        icon: LayoutDashboard,
        action: () => {
          router.push("/dashboard");
          onClose();
        },
      },
      {
        id: "nav-projects",
        title: "All Projects",
        subtitle: "View and manage all engineering workspaces",
        category: "Navigation",
        icon: FolderKanban,
        action: () => {
          router.push("/dashboard/projects");
          onClose();
        },
      },
      {
        id: "nav-tasks",
        title: "My Tasks",
        subtitle: "All tasks assigned to you across all projects",
        category: "Navigation",
        icon: AlignLeft,
        action: () => {
          router.push("/dashboard/tasks");
          onClose();
        },
      },
      {
        id: "nav-team",
        title: "Team Directory",
        subtitle: "Workspace members and invitations",
        category: "Navigation",
        icon: Users,
        action: () => {
          router.push("/dashboard/team");
          onClose();
        },
      },
      {
        id: "nav-analytics",
        title: "Global Analytics",
        subtitle: "Organization-wide engineering productivity",
        category: "Navigation",
        icon: BarChart3,
        action: () => {
          router.push("/dashboard/analytics");
          onClose();
        },
      },
      {
        id: "nav-notifications",
        title: "Notifications",
        subtitle: "All alerts, mentions, and project updates",
        category: "Navigation",
        icon: Bell,
        action: () => {
          router.push("/dashboard/notifications");
          onClose();
        },
      },
      {
        id: "nav-settings",
        title: "Workspace Settings",
        subtitle: "Manage permissions, roles, and preferences",
        category: "Navigation",
        icon: Settings,
        action: () => {
          router.push("/dashboard/settings");
          onClose();
        },
      },
      {
        id: "nav-profile",
        title: "User Profile",
        subtitle: `Account details for ${user?.name || "User"}`,
        category: "Navigation",
        icon: User,
        action: () => {
          router.push("/dashboard/profile");
          onClose();
        },
      }
    );

    // Filter by query
    if (!query.trim()) return list;

    const q = query.toLowerCase();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q)
    );
  }, [query, projects, currentProject, user, theme, setTheme, router, onClose, onOpenNewTask, onOpenNewProject]);

  // Handle keyboard arrow navigation & Escape on input
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(1, items.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[14vh] p-3 sm:p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#03060f]/80 backdrop-blur-md cursor-pointer"
        />

        {/* Command Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#090d1c] border border-white/[0.12] rounded-2xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(124,92,255,0.15)] z-10 overflow-hidden flex flex-col max-h-[72vh]"
        >
          {/* ── Search Input Header with Back/Close Arrow ── */}
          <div className="flex items-center px-3 sm:px-4 py-3 border-b border-white/[0.08] gap-2.5 sm:gap-3 bg-[#090d1c]">
            {/* Clickable Back/Close Arrow Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              title="Close"
              aria-label="Close Command Palette"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <Search className="w-4 h-4 text-violet-400 flex-shrink-0" />

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search projects, views, tasks, or jump to page..."
              className="w-full bg-transparent text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none"
            />

            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-0.5 select-none">
                ESC
              </kbd>
            )}
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {items.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No matching results found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              items.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-violet-500/15 border border-violet-500/40 text-white"
                        : "hover:bg-white/[0.04] text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                        style={{
                          backgroundColor: item.color || "rgba(124, 92, 255, 0.15)",
                        }}
                      >
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-white">
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.badge && (
                        <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-500/15 border border-violet-500/20 px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 uppercase font-mono">
                        {item.category}
                      </span>
                      {isSelected && (
                        <ArrowRight className="w-3 h-3 text-violet-400" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 py-2.5 bg-[#070a16] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[10px] text-slate-400">
                  ↑↓
                </kbd>{" "}
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[10px] text-slate-400">
                  ↵
                </kbd>{" "}
                Select
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              SprintForge Command Engine
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
