"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Moon,
  Sun,
  Menu,
  Plus,
  Command,
  User,
  Settings,
  LogOut,
  ChevronDown,
  FolderKanban,
  Zap,
  Columns3,
  AlignLeft,
  LayoutDashboard,
  Users,
  BarChart3,
  Bug,
  MessageSquare,
  BookOpen,
  Bell,
  Check,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { generateAvatar, cn } from "@/lib/utils";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { AppCommandPalette } from "@/components/shared/AppCommandPalette";
import toast from "react-hot-toast";

interface NavbarProps {
  onMenuClick?: () => void;
}

const PROJECT_VIEWS = [
  { key: "board", label: "Board", icon: Columns3, desc: "Kanban & Scrum Task Board" },
  { key: "backlog", label: "Backlog", icon: AlignLeft, desc: "Sprint Planning & Prioritization" },
  { key: "sprints", label: "Sprints", icon: Zap, desc: "Sprint Cycles & Velocity" },
  { key: "issues", label: "Issues", icon: Bug, desc: "Bug Tracking & Triage" },
  { key: "chat", label: "Chat Room", icon: MessageSquare, desc: "Real-time Team Discussion" },
  { key: "analytics", label: "Analytics", icon: BarChart3, desc: "Burndown & Velocity Charts" },
  { key: "team", label: "Team", icon: Users, desc: "Project Members & Roles" },
  { key: "wiki", label: "Wiki", icon: BookOpen, desc: "Docs & Specifications" },
];

export function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { projects, currentProject, fetchProjects } = useProjectStore();
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Modals & Menus State
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  // Dropdown States
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [viewSwitcherOpen, setViewSwitcherOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Refs for outside clicks
  const projectSwitcherRef = useRef<HTMLDivElement>(null);
  const viewSwitcherRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        projectSwitcherRef.current &&
        !projectSwitcherRef.current.contains(target)
      ) {
        setProjectSwitcherOpen(false);
      }
      if (
        viewSwitcherRef.current &&
        !viewSwitcherRef.current.contains(target)
      ) {
        setViewSwitcherOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Route Context Extraction ───────────────────────────────────────────────
  const segments = pathname.split("/").filter(Boolean);

  // Check if we are inside a project: e.g. /dashboard/projects/[id]/[view]
  const projectSegmentIdx = segments.indexOf("projects");
  const urlProjectId =
    projectSegmentIdx !== -1 &&
    segments[projectSegmentIdx + 1]?.match(/^[0-9a-f]{24}$/i)
      ? segments[projectSegmentIdx + 1]
      : null;

  const currentViewKey =
    urlProjectId && segments[projectSegmentIdx + 2]
      ? segments[projectSegmentIdx + 2]
      : "board";

  const activeProject = useMemo(() => {
    if (urlProjectId) {
      return projects.find((p) => p._id === urlProjectId) || currentProject;
    }
    return null;
  }, [urlProjectId, projects, currentProject]);

  const activeView = useMemo(() => {
    return (
      PROJECT_VIEWS.find((v) => v.key === currentViewKey) || {
        key: "board",
        label: "Board",
        icon: Columns3,
        desc: "Kanban & Scrum Task Board",
      }
    );
  }, [currentViewKey]);

  // Handle New Task Action
  const handleNewTask = () => {
    if (projects.length === 0) {
      toast("Create a project first to add tasks!", { icon: "💡" });
      setShowProjectModal(true);
      return;
    }
    if (urlProjectId) {
      setSelectedProjectId(urlProjectId);
      setShowTaskModal(true);
    } else if (projects.length === 1) {
      setSelectedProjectId(projects[0]._id);
      setShowTaskModal(true);
    } else {
      setShowProjectPicker(true);
    }
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    router.push("/login");
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 h-[64px] transition-all duration-200 flex items-center px-4 sm:px-6 justify-between gap-4 border-b",
          isScrolled
            ? "bg-[#060913]/90 backdrop-blur-xl border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            : "bg-[#060913]/60 backdrop-blur-md border-white/[0.05]"
        )}
      >
        {/* ─── LEFT: Context-Aware Workspace & Project Hierarchy ─── */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Mobile Sidebar Toggle Button */}
          <button
            onClick={onMenuClick}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* ── CONTEXT 1: Inside a Project (/dashboard/projects/[id]/...) ── */}
          {activeProject ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              {/* Project Switcher Dropdown */}
              <div ref={projectSwitcherRef} className="relative">
                <button
                  onClick={() => {
                    setProjectSwitcherOpen((prev) => !prev);
                    setViewSwitcherOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] transition-all cursor-pointer group"
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: activeProject.color || "#6366f1" }}
                  >
                    {activeProject.key?.charAt(0) || "P"}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] sm:max-w-[180px]">
                    {activeProject.name}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-violet-300 bg-violet-500/15 border border-violet-500/25 px-1 rounded">
                    {activeProject.key}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200",
                      projectSwitcherOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Project Switcher Dropdown Menu */}
                <AnimatePresence>
                  {projectSwitcherOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 6 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 top-full mt-2 w-64 bg-[#090d1c] border border-white/[0.12] rounded-2xl shadow-2xl z-50 p-1.5 overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Switch Project
                        </span>
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-0.5">
                        {projects.map((proj) => {
                          const isCurrent = proj._id === activeProject._id;
                          return (
                            <button
                              key={proj._id}
                              onClick={() => {
                                setProjectSwitcherOpen(false);
                                router.push(
                                  `/dashboard/projects/${proj._id}/${currentViewKey}`
                                );
                              }}
                              className={cn(
                                "w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer group",
                                isCurrent
                                  ? "bg-violet-500/15 border border-violet-500/30 text-white"
                                  : "hover:bg-white/[0.04] text-slate-300"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                  style={{ backgroundColor: proj.color }}
                                >
                                  {proj.key.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate text-white">
                                    {proj.name}
                                  </p>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {proj.key} • {proj.type}
                                  </span>
                                </div>
                              </div>
                              {isCurrent && (
                                <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-1.5 mt-1 border-t border-white/[0.06] flex items-center justify-between gap-1">
                        <button
                          onClick={() => {
                            setProjectSwitcherOpen(false);
                            setShowProjectModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-violet-300 hover:bg-violet-500/10 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>New Project</span>
                        </button>
                        <Link
                          href="/dashboard/projects"
                          onClick={() => setProjectSwitcherOpen(false)}
                          className="px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                          All Projects
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hierarchy Separator */}
              <span className="text-slate-600 font-mono text-xs select-none">/</span>

              {/* Current Project View Switcher Dropdown */}
              <div ref={viewSwitcherRef} className="relative">
                <button
                  onClick={() => {
                    setViewSwitcherOpen((prev) => !prev);
                    setProjectSwitcherOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group"
                >
                  <activeView.icon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white">
                    {activeView.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200",
                      viewSwitcherOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* View Switcher Dropdown Menu */}
                <AnimatePresence>
                  {viewSwitcherOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 6 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 top-full mt-2 w-56 bg-[#090d1c] border border-white/[0.12] rounded-2xl shadow-2xl z-50 p-1.5 overflow-hidden"
                    >
                      <div className="px-3 py-1.5 border-b border-white/[0.06] mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Project Views
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {PROJECT_VIEWS.map((view) => {
                          const Icon = view.icon;
                          const isCurrent = view.key === activeView.key;
                          return (
                            <button
                              key={view.key}
                              onClick={() => {
                                setViewSwitcherOpen(false);
                                router.push(
                                  `/dashboard/projects/${activeProject._id}/${view.key}`
                                );
                              }}
                              className={cn(
                                "w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer",
                                isCurrent
                                  ? "bg-violet-500/15 border border-violet-500/30 text-white"
                                  : "hover:bg-white/[0.04] text-slate-300"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon
                                  className={cn(
                                    "w-3.5 h-3.5 flex-shrink-0",
                                    isCurrent ? "text-violet-400" : "text-slate-400"
                                  )}
                                />
                                <span className="text-xs font-semibold">
                                  {view.label}
                                </span>
                              </div>
                              {isCurrent && (
                                <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* ── CONTEXT 2: Standalone Pages (Dashboard, Projects, Tasks, etc.) ── */
            <div className="flex items-center gap-2">
              {pathname === "/dashboard" && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <LayoutDashboard className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Dashboard
                  </h1>
                </div>
              )}

              {pathname === "/dashboard/projects" && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <FolderKanban className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Projects
                  </h1>
                  <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.08]">
                    {projects.length}
                  </span>
                </div>
              )}

              {pathname === "/dashboard/tasks" && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <AlignLeft className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    My Tasks
                  </h1>
                </div>
              )}

              {pathname === "/dashboard/team" && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Team Directory
                  </h1>
                </div>
              )}

              {pathname === "/dashboard/analytics" && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Analytics
                  </h1>
                </div>
              )}

              {pathname === "/dashboard/notifications" && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Notifications
                  </h1>
                </div>
              )}

              {pathname === "/dashboard/settings" && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                    <Settings className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Settings
                  </h1>
                </div>
              )}

              {pathname === "/dashboard/profile" && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    User Profile
                  </h1>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT: Search, Quick Actions, Theme, Notifs & Profile ─── */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* 1. Command Palette / Search Trigger */}
          <button
            onClick={() => setShowCommandPalette(true)}
            aria-label="Open Command Search"
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.15] text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
          >
            <Search className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden md:inline-block">Search anything...</span>
            <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] font-mono border border-white/[0.1] bg-white/[0.04] rounded px-1.5 py-0.5 text-slate-400">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>

          {/* 2. Primary Action: + New Task */}
          <button
            onClick={handleNewTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_18px_rgba(124,92,255,0.35)] hover:shadow-[0_0_24px_rgba(124,92,255,0.55)] transition-all cursor-pointer active:scale-95 group"
          >
            <Plus className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-90" />
            <span className="hidden sm:inline-block">New Task</span>
          </button>

          {/* 3. Theme Appearance Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme appearance"
              title="Toggle theme appearance"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
            </button>
          )}

          {/* 4. Real-time Notifications Bell */}
          <NotificationBell />

          {/* 5. User Profile Menu */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-label="Open user profile menu"
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer group"
            >
              <img
                src={user?.avatar || generateAvatar(user?.name || "User")}
                alt={user?.name || "User"}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-violet-500/30 group-hover:ring-violet-500/60 transition-all"
              />
              <ChevronDown
                className={cn(
                  "w-3 h-3 text-slate-400 group-hover:text-white transition-transform duration-200",
                  profileOpen && "rotate-180"
                )}
              />
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-2 w-60 bg-[#090d1c] border border-white/[0.12] rounded-2xl shadow-2xl z-50 overflow-hidden p-1.5"
                >
                  {/* User Details */}
                  <div className="px-3 py-2.5 border-b border-white/[0.06]">
                    <p className="text-xs font-bold text-white truncate">
                      {user?.name || "Engineer"}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {user?.email || "developer@sprintforge.dev"}
                    </p>
                    <span className="inline-block mt-1.5 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/25 uppercase">
                      {user?.role || "Developer"}
                    </span>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1 space-y-0.5">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Account Profile</span>
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Workspace Settings</span>
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-1 border-t border-white/[0.06]">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ─── Global Command Palette Dialog ─── */}
      <AppCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onOpenNewTask={handleNewTask}
        onOpenNewProject={() => setShowProjectModal(true)}
      />

      {/* ─── Project Selector Modal (Fallback when clicking New Task without active project) ─── */}
      {showProjectPicker && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
            onClick={() => setShowProjectPicker(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-[#090d1c] border border-white/[0.12] rounded-2xl p-5 shadow-2xl z-10 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Select Project</h3>
              <button
                onClick={() => setShowProjectPicker(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Choose which project you want to create a task in:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {projects.map((p) => (
                <button
                  key={p._id}
                  onClick={() => {
                    setSelectedProjectId(p._id);
                    setShowProjectPicker(false);
                    setShowTaskModal(true);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-violet-500/10 border border-white/[0.06] hover:border-violet-500/30 transition-all text-left cursor-pointer group"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.key.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-violet-300">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {p.key} • {p.type}
                    </p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-violet-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowProjectPicker(false)}
              className="mt-4 w-full py-2 border border-white/[0.08] hover:bg-white/[0.04] text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* ─── Task Creation Modal ─── */}
      {showTaskModal && selectedProjectId && (
        <CreateTaskModal
          projectId={selectedProjectId}
          onClose={() => setShowTaskModal(false)}
          onCreate={() => {
            setShowTaskModal(false);
            toast.success("Task created! 🚀");
          }}
        />
      )}

      {/* ─── Project Creation Modal ─── */}
      {showProjectModal && (
        <CreateProjectModal
          onClose={() => setShowProjectModal(false)}
          onCreate={(project) => {
            setShowProjectModal(false);
            fetchProjects();
            router.push(`/dashboard/projects/${project._id}/board`);
          }}
        />
      )}
    </>
  );
}
