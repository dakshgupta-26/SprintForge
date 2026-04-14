"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, Zap, BarChart3, BookOpen,
  Bell, Users, Settings, ChevronDown, Plus, Sparkles,
  Target, Bug, AlignLeft, MessageSquare
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  { label: "Board", href: `/dashboard/projects/${id}/board`, icon: FolderKanban },
  { label: "Backlog", href: `/dashboard/projects/${id}/backlog`, icon: AlignLeft },
  { label: "Sprints", href: `/dashboard/projects/${id}/sprints`, icon: Zap },
  { label: "Issues", href: `/dashboard/projects/${id}/issues`, icon: Bug },
  { label: "Chat", href: `/dashboard/projects/${id}/chat`, icon: MessageSquare },
  { label: "Analytics", href: `/dashboard/projects/${id}/analytics`, icon: BarChart3 },
  { label: "Team", href: `/dashboard/projects/${id}/team`, icon: Users },
  { label: "Wiki", href: `/dashboard/projects/${id}/wiki`, icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { projects, currentProject } = useProjectStore();
  const [projectsOpen, setProjectsOpen] = useState(true);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-foreground text-sm">SprintForge</span>
          <p className="text-xs text-muted-foreground">Agile Platform</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">General</p>
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </div>

        {/* Projects */}
        <div>
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>Projects</span>
            <div className="flex items-center gap-1">
              <Link href="/dashboard/projects/new" onClick={(e) => e.stopPropagation()}
                className="p-0.5 hover:bg-accent rounded transition-colors">
                <Plus className="w-3 h-3" />
              </Link>
              <ChevronDown className={cn("w-3 h-3 transition-transform", !projectsOpen && "-rotate-90")} />
            </div>
          </button>
          <AnimatePresence>
            {projectsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {projects.slice(0, 8).map((project) => (
                  <div key={project._id}>
                    <Link
                      href={`/dashboard/projects/${project._id}/board`}
                      className={cn(
                        "flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all duration-150 group",
                        isActive(`/dashboard/projects/${project._id}`)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      >
                        {project.key.charAt(0)}
                      </div>
                      <span className="truncate">{project.name}</span>
                    </Link>
                    {/* Project sub-nav when active */}
                    {currentProject?._id === project._id && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
                        {projectNav(project._id).map((item) => (
                          <NavLink key={item.href} item={item} isActive={isActive(item.href)} small />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2 py-2">No projects yet</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <Link href="/dashboard/settings" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted transition-colors">
          <img 
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || "U"}&background=random`} 
            alt={user?.name} 
            className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-border"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.role}</p>
          </div>
          <Settings className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        </Link>
      </div>
    </aside>
  );
}

function NavLink({ item, isActive, small = false }: { item: NavItem; isActive: boolean; small?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-2 rounded-lg transition-all duration-150 group relative",
        small ? "py-1.5 text-xs" : "py-2 text-sm",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-full"
        />
      )}
      <Icon className={cn("flex-shrink-0", small ? "w-3.5 h-3.5" : "w-4 h-4")} />
      <span className="truncate">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}
