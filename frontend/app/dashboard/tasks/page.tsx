"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { taskAPI } from "@/lib/api";
import { cn, PRIORITY_BG, STATUS_LABELS, formatDate, generateAvatar } from "@/lib/utils";
import {
  CheckCircle2, Clock, Flag, Filter, Search, SlidersHorizontal,
  Plus, Loader2, AlertCircle, Circle, ArrowRight, Zap
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["all", "todo", "in_progress", "in_review", "done", "blocked"];
const PRIORITY_OPTIONS = ["all", "low", "medium", "high", "critical"];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  todo:        <Circle        className="w-3.5 h-3.5 text-slate-400" />,
  in_progress: <Zap          className="w-3.5 h-3.5 text-indigo-400" />,
  in_review:   <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />,
  done:        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  blocked:     <AlertCircle  className="w-3.5 h-3.5 text-red-400" />,
};

export default function MyTasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks]           = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [priorityFilter, setPriority] = useState("all");

  const load = useCallback(async () => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      const params: any = { assignee: user._id };
      if (statusFilter !== "all")   params.status   = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (search.trim())            params.search   = search.trim();
      const { data } = await taskAPI.getAll(params);
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, statusFilter, priorityFilter, search]);

  useEffect(() => { load(); }, [load]);

  // Stats from loaded tasks (ignore filters for stats)
  const [allTasks, setAllTasks] = useState<any[]>([]);
  useEffect(() => {
    if (!user?._id) return;
    taskAPI.getAll({ assignee: user._id }).then(({ data }) => setAllTasks(data)).catch(() => {});
  }, [user?._id]);

  const stats = {
    total:      allTasks.length,
    done:       allTasks.filter((t) => t.status === "done").length,
    inProgress: allTasks.filter((t) => t.status === "in_progress").length,
    overdue:    allTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">All tasks assigned to you across every project</p>
        </div>
      </motion.div>

      {/* Stat strip */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",       value: stats.total,      color: "text-blue-500",  bg: "bg-blue-500/10"  },
          { label: "In Progress", value: stats.inProgress, color: "text-indigo-500",bg: "bg-indigo-500/10"},
          { label: "Completed",   value: stats.done,       color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Overdue",     value: stats.overdue,    color: "text-red-500",   bg: "bg-red-500/10"   },
        ].map((s) => (
          <div key={s.label}
            className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.bg)}>
              <span className={cn("text-sm font-black", s.color)}>{s.value}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border bg-card">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Status filter */}
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : STATUS_LABELS[s] || s}</option>
          ))}
        </select>

        {/* Priority filter */}
        <select value={priorityFilter} onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p === "all" ? "All Priorities" : p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </motion.div>

      {/* Task list */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground font-medium">No tasks found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter !== "all" || priorityFilter !== "all" || search
                ? "Try adjusting your filters"
                : "Tasks assigned to you will appear here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence>
              {tasks.map((task, i) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/dashboard/projects/${task.project?._id || task.project}/board`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors group"
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {STATUS_ICONS[task.status] || <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>

                    {/* Title */}
                    <span className={cn(
                      "flex-1 text-sm truncate",
                      task.status === "done"
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    )}>
                      {task.title}
                    </span>

                    {/* Project badge */}
                    {task.project?.name && (
                      <span className="hidden md:block text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium flex-shrink-0">
                        {task.project.name}
                      </span>
                    )}

                    {/* Priority */}
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0", PRIORITY_BG[task.priority])}>
                      <Flag className="w-2.5 h-2.5 inline mr-0.5" />
                      {task.priority}
                    </span>

                    {/* Due date */}
                    {task.dueDate && (
                      <span className={cn(
                        "hidden sm:flex items-center gap-1 text-xs flex-shrink-0",
                        new Date(task.dueDate) < new Date() && task.status !== "done"
                          ? "text-red-500"
                          : "text-muted-foreground"
                      )}>
                        <Clock className="w-3 h-3" />
                        {formatDate(task.dueDate, "short")}
                      </span>
                    )}

                    {/* Assignee avatars (others on same task) */}
                    <div className="hidden md:flex -space-x-1.5 flex-shrink-0">
                      {task.assignees?.slice(0, 3).map((u: any) => (
                        <img key={u._id} src={u.avatar || generateAvatar(u.name)}
                          alt={u.name} title={u.name}
                          className="w-5 h-5 rounded-full border-2 border-card object-cover" />
                      ))}
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {tasks.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
