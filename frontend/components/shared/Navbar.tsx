"use client";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Moon, Sun, Menu, Plus, Command, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { generateAvatar } from "@/lib/utils";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { notificationAPI, projectAPI } from "@/lib/api";
import { connectSocket, getSocket } from "@/lib/socket";
import toast from "react-hot-toast";

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  board: "Board",
  backlog: "Backlog",
  sprints: "Sprints",
  analytics: "Analytics",
  team: "Team",
  wiki: "Wiki",
  chat: "Chat Room",
  notifications: "Notifications",
  settings: "Settings",
  issues: "Issues",
  tasks: "My Tasks",
};

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { projects } = useProjectStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (user) {
      connectSocket(user._id);
      const s = getSocket();
      s.on("notification:new", (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        toast.success(notif.title);
      });
      notificationAPI.getAll().then((res) => {
        if (res.data && Array.isArray(res.data.notifications)) {
          setNotifications(res.data.notifications);
        } else if (Array.isArray(res.data)) {
          setNotifications(res.data);
        }
      }).catch(() => {});
      return () => { s.off("notification:new"); };
    }
  }, [user]);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments
    .filter((s) => !s.match(/^[0-9a-f]{24}$/i))
    .map((s) => BREADCRUMB_MAP[s] || s);

  const urlProjectId = segments[segments.indexOf("projects") + 1];
  const isValidMongoId = urlProjectId?.match(/^[0-9a-f]{24}$/i);

  const handleNewTask = () => {
    if (projects.length === 0) {
      toast("Create a project first to add tasks!", { icon: "💡" });
      setShowProjectModal(true);
      return;
    }
    if (isValidMongoId) {
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
      <header className="sticky top-0 z-30 h-[60px] border-b border-border bg-background/80 backdrop-blur-md flex items-center px-4 gap-3">
        {/* Mobile menu */}
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
          <Menu className="w-4 h-4" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground">/</span>}
              <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>

        {/* Search */}
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <kbd className="ml-2 flex items-center gap-1 text-[10px] border border-border rounded px-1">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* New Task */}
        <button
          onClick={handleNewTask}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>

        {/* Theme */}
        {mounted && (
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-muted transition-colors" title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </motion.button>
        )}

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
          
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => {
                        notificationAPI.markAllRead();
                        setNotifications(notifications.map(n => ({...n, isRead: true})));
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {safeNotifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    safeNotifications.map((n) => (
                      <div key={n._id} className={`p-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}>
                        <div className="flex gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{n.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                            <div className="mt-2 flex items-center gap-2">
                              {n.link && (
                                <Link 
                                  href={n.link} 
                                  onClick={() => handleMarkRead(n._id)}
                                  className="text-[11px] bg-primary text-white px-2 py-1 rounded shadow-sm hover:bg-primary/90 transition-colors"
                                >
                                  View
                                </Link>
                              )}
                              {!n.isRead && (
                                <button onClick={() => handleMarkRead(n._id)} className="text-[11px] text-muted-foreground hover:text-foreground">
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                          {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 flex-shrink-0" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Profile Dropdown ──────────────────────────────────── */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-muted transition-colors"
            aria-label="Open profile menu"
          >
            <img
              src={user?.avatar || generateAvatar(user?.name || "U")}
              alt={user?.name}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/30"
            />
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {/* User header */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                    {user?.role}
                  </span>
                </div>

                {/* Links */}
                <div className="p-1.5 space-y-0.5">
                  <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                    <User className="w-4 h-4 text-muted-foreground" /> Profile
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                    <Settings className="w-4 h-4 text-muted-foreground" /> Settings
                  </Link>
                </div>

                {/* Sign out */}
                <div className="p-1.5 border-t border-border">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Project picker */}
      {showProjectPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProjectPicker(false)} />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl z-10">
            <h2 className="text-lg font-bold mb-4">Select a Project</h2>
            <div className="space-y-2">
              {projects.map((p) => (
                <button key={p._id}
                  onClick={() => { setSelectedProjectId(p._id); setShowProjectPicker(false); setShowTaskModal(true); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: p.color }}>
                    {p.key.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.key}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowProjectPicker(false)}
              className="mt-4 w-full py-2 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showTaskModal && selectedProjectId && (
        <CreateTaskModal projectId={selectedProjectId}
          onClose={() => setShowTaskModal(false)}
          onCreate={() => { setShowTaskModal(false); toast.success("Task created!"); }}
        />
      )}

      {showProjectModal && (
        <CreateProjectModal onClose={() => setShowProjectModal(false)}
          onCreate={(project) => { setShowProjectModal(false); router.push(`/dashboard/projects/${project._id}/board`); }}
        />
      )}
    </>
  );
}
