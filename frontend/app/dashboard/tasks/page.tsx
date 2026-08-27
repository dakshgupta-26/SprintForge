"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  Flag,
  Filter,
  Search,
  SlidersHorizontal,
  Plus,
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  FolderKanban,
  Calendar,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { taskAPI, projectAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { getSocket, connectSocket } from "@/lib/socket";
import { TaskStats } from "@/components/tasks/TaskStats";
import { ProductivitySnapshot } from "@/components/tasks/ProductivitySnapshot";
import {
  TaskToolbar,
  TaskViewMode,
  TaskGroupBy,
  TaskSortBy,
} from "@/components/tasks/TaskToolbar";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskCompactRow } from "@/components/tasks/TaskCompactRow";
import { TaskBoardView } from "@/components/tasks/TaskBoardView";
import { TaskEmptyState } from "@/components/tasks/TaskEmptyState";
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton";
import { TaskDetailDrawer } from "@/components/board/TaskDetailDrawer";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type TimeScope = "all" | "today" | "week" | "overdue" | "completed";

export default function MyTasksPage() {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();

  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Scope Header Tab
  const [timeScope, setTimeScope] = useState<TimeScope>("all");

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [groupBy, setGroupBy] = useState<TaskGroupBy>("dueDate");
  const [sortBy, setSortBy] = useState<TaskSortBy>("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<TaskViewMode>("list");

  // Task Detail Drawer
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // ── Load User's Assigned Tasks ──
  const loadTasks = useCallback(
    async (isBackground = false) => {
      if (!user?._id) return;
      if (!isBackground) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const { data } = await taskAPI.getAll({ assignee: user._id });
        setTasks(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Failed to load your assigned tasks");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?._id]
  );

  useEffect(() => {
    loadTasks();
    fetchProjects();
  }, [loadTasks, fetchProjects]);

  // ── Real-Time Socket.IO Synchronization ──
  useEffect(() => {
    if (!user?._id) return;
    connectSocket(user._id);
    const socket = getSocket();
    if (!socket) return;

    const handleTaskEvent = () => {
      loadTasks(true);
    };

    socket.on("task:created", handleTaskEvent);
    socket.on("task:updated", handleTaskEvent);
    socket.on("task:deleted", handleTaskEvent);
    socket.on("task:status_changed", handleTaskEvent);
    socket.on("notification", handleTaskEvent);

    return () => {
      socket.off("task:created", handleTaskEvent);
      socket.off("task:updated", handleTaskEvent);
      socket.off("task:deleted", handleTaskEvent);
      socket.off("task:status_changed", handleTaskEvent);
      socket.off("notification", handleTaskEvent);
    };
  }, [user?._id, loadTasks]);

  // ── Stats Calculations ──
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const highPriority = tasks.filter(
      (t) => t.priority === "high" || t.priority === "critical"
    ).length;

    const now = new Date();
    const todayStr = now.toDateString();

    const dueToday = tasks.filter((t) => {
      if (!t.dueDate || t.status === "done") return false;
      return new Date(t.dueDate).toDateString() === todayStr;
    }).length;

    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === "done") return false;
      return new Date(t.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
    }).length;

    return { total, completed, inProgress, overdue, dueToday, highPriority };
  }, [tasks]);

  // ── Filter & Search Application ──
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. TimeScope Header Tab
      if (timeScope === "today") {
        const isToday =
          task.dueDate &&
          new Date(task.dueDate).toDateString() === new Date().toDateString();
        const isInProgress = task.status === "in_progress";
        if (!isToday && !isInProgress) return false;
      } else if (timeScope === "week") {
        if (!task.dueDate) return false;
        const diffDays =
          (new Date(task.dueDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24);
        if (diffDays < -1 || diffDays > 7) return false;
      } else if (timeScope === "overdue") {
        const isOverdue =
          task.dueDate &&
          new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) &&
          task.status !== "done";
        if (!isOverdue) return false;
      } else if (timeScope === "completed") {
        if (task.status !== "done") return false;
      }

      // 2. Status Dropdown
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      // 3. Priority Dropdown
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      // 4. Project Filter
      if (projectFilter !== "all") {
        const pId = task.project?._id || task.project;
        if (pId !== projectFilter) return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = task.title?.toLowerCase().includes(q);
        const descMatch = task.description?.toLowerCase().includes(q);
        const projMatch = task.project?.name?.toLowerCase().includes(q);
        const keyMatch = task.project?.key?.toLowerCase().includes(q);
        const shortIdMatch = task._id?.slice(-4).toLowerCase().includes(q);
        const labelMatch = task.labels?.some((l: string) =>
          l.toLowerCase().includes(q)
        );

        if (
          !titleMatch &&
          !descMatch &&
          !projMatch &&
          !keyMatch &&
          !shortIdMatch &&
          !labelMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    timeScope,
    statusFilter,
    priorityFilter,
    projectFilter,
    searchQuery,
  ]);

  // ── Sorting ──
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "dueDate") {
        if (a.dueDate && b.dueDate) {
          comparison =
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (a.dueDate) comparison = -1;
        else if (b.dueDate) comparison = 1;
      } else if (sortBy === "priority") {
        const pWeight: Record<string, number> = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        comparison = (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0);
      } else if (sortBy === "points") {
        comparison = (b.storyPoints || 0) - (a.storyPoints || 0);
      } else if (sortBy === "created") {
        comparison =
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "status") {
        comparison = (a.status || "").localeCompare(b.status || "");
      } else if (sortBy === "title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredTasks, sortBy, sortOrder]);

  // ── Grouping ──
  const groupedTasks = useMemo(() => {
    const groups: Record<string, any[]> = {};

    if (groupBy === "none") {
      groups["ALL TASKS"] = sortedTasks;
      return groups;
    }

    if (groupBy === "dueDate") {
      groups["TODAY & ACTIVE"] = [];
      groups["UPCOMING"] = [];
      groups["COMPLETED"] = [];

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();

      sortedTasks.forEach((t) => {
        if (t.status === "done") {
          groups["COMPLETED"].push(t);
        } else if (!t.dueDate) {
          groups["TODAY & ACTIVE"].push(t);
        } else {
          const dueTime = new Date(t.dueDate).getTime();
          if (dueTime <= todayStart + 24 * 60 * 60 * 1000) {
            groups["TODAY & ACTIVE"].push(t);
          } else {
            groups["UPCOMING"].push(t);
          }
        }
      });

      return groups;
    }

    if (groupBy === "status") {
      groups["IN PROGRESS"] = [];
      groups["TO DO"] = [];
      groups["IN REVIEW"] = [];
      groups["BLOCKED"] = [];
      groups["COMPLETED"] = [];

      sortedTasks.forEach((t) => {
        if (t.status === "in_progress") groups["IN PROGRESS"].push(t);
        else if (t.status === "review" || t.status === "in_review")
          groups["IN REVIEW"].push(t);
        else if (t.status === "blocked") groups["BLOCKED"].push(t);
        else if (t.status === "done") groups["COMPLETED"].push(t);
        else groups["TO DO"].push(t);
      });

      return groups;
    }

    if (groupBy === "priority") {
      groups["CRITICAL (P0)"] = [];
      groups["HIGH (P1)"] = [];
      groups["MEDIUM (P2)"] = [];
      groups["LOW (P3)"] = [];

      sortedTasks.forEach((t) => {
        if (t.priority === "critical") groups["CRITICAL (P0)"].push(t);
        else if (t.priority === "high") groups["HIGH (P1)"].push(t);
        else if (t.priority === "medium") groups["MEDIUM (P2)"].push(t);
        else groups["LOW (P3)"].push(t);
      });

      return groups;
    }

    if (groupBy === "project") {
      sortedTasks.forEach((t) => {
        const pName = t.project?.name || "Unassigned Project";
        if (!groups[pName]) groups[pName] = [];
        groups[pName].push(t);
      });

      return groups;
    }

    return { "ALL TASKS": sortedTasks };
  }, [sortedTasks, groupBy]);

  // ── Actions ──
  const handleToggleComplete = async (
    taskId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await taskAPI.updateStatus(taskId, {
        status: newStatus,
        boardColumn: newStatus,
      });
      toast.success(
        newStatus === "done" ? "Task completed! 🎉" : "Task marked as to do"
      );
    } catch {
      toast.error("Failed to update task status");
      loadTasks(true);
    }
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setProjectFilter("all");
    setTimeScope("all");
  };

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0) +
    (projectFilter !== "all" ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (timeScope !== "all" ? 1 : 0);

  // Selected task context for detail drawer
  const selectedTask = useMemo(() => {
    return tasks.find((t) => t._id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const selectedProjectId =
    selectedTask?.project?._id || selectedTask?.project || projects[0]?._id || "";

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-6 pb-16">
      {/* ── 1. Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md flex-shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                My Tasks
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                {tasks.length} total work items
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Your personal engineering workspace across every project & sprint
            </p>
          </div>
        </div>

        {/* Time Scope Tabs & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-2xl bg-[#090d1f] border border-white/[0.08]">
            {(
              [
                { id: "all", label: "All Tasks" },
                { id: "today", label: "Today" },
                { id: "week", label: "This Week" },
                { id: "overdue", label: "Overdue" },
                { id: "completed", label: "Completed" },
              ] as const
            ).map((tab) => {
              const isSelected = timeScope === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTimeScope(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,92,255,0.4)]"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => loadTasks(true)}
            disabled={isRefreshing}
            title="Refresh Tasks"
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={cn("w-4 h-4", isRefreshing && "animate-spin text-violet-400")}
            />
          </button>
        </div>
      </motion.div>

      {/* ── 2. Compact Personal Task Metrics ── */}
      <TaskStats
        total={stats.total}
        inProgress={stats.inProgress}
        completed={stats.completed}
        overdue={stats.overdue}
        dueToday={stats.dueToday}
        highPriority={stats.highPriority}
      />

      {/* ── 3. Productivity Snapshot & Recommended Focus ── */}
      <ProductivitySnapshot
        tasks={tasks}
        onSelectTask={(id) => setSelectedTaskId(id)}
      />

      {/* ── 4. Smart Task Filtering & Toolbar ── */}
      <TaskToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        projectFilter={projectFilter}
        onProjectChange={setProjectFilter}
        projectsList={projects}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onToggleSortOrder={() =>
          setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
        }
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearAllFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* ── 5. Main Task Workspace Feed ── */}
      {isLoading ? (
        <TaskSkeleton />
      ) : filteredTasks.length === 0 ? (
        <TaskEmptyState
          hasFilters={activeFilterCount > 0}
          onClearFilters={handleClearAllFilters}
        />
      ) : viewMode === "board" ? (
        <TaskBoardView
          tasks={sortedTasks}
          onSelectTask={(id) => setSelectedTaskId(id)}
          onToggleComplete={handleToggleComplete}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([groupTitle, groupItems]) => {
            if (groupItems.length === 0) return null;

            return (
              <div key={groupTitle} className="space-y-2.5">
                {/* Group Section Header */}
                <div className="flex items-center gap-2.5 px-1 pt-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    {groupTitle}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] font-mono text-slate-500">
                    {groupItems.length}{" "}
                    {groupItems.length === 1 ? "task" : "tasks"}
                  </span>
                </div>

                {/* Task Rows List */}
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {groupItems.map((task) =>
                      viewMode === "compact" ? (
                        <TaskCompactRow
                          key={task._id}
                          task={task}
                          onSelectTask={(id) => setSelectedTaskId(id)}
                          onToggleComplete={handleToggleComplete}
                        />
                      ) : (
                        <TaskRow
                          key={task._id}
                          task={task}
                          onSelectTask={(id) => setSelectedTaskId(id)}
                          onToggleComplete={handleToggleComplete}
                        />
                      )
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 6. Task Detail Drawer Slide-over ── */}
      {selectedTaskId && (
        <TaskDetailDrawer
          isOpen={Boolean(selectedTaskId)}
          taskId={selectedTaskId}
          projectId={selectedProjectId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={() => loadTasks(true)}
          onTaskDeleted={() => {
            setSelectedTaskId(null);
            loadTasks(true);
          }}
        />
      )}
    </div>
  );
}
