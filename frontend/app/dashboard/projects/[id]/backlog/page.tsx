"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { taskAPI, sprintAPI } from "@/lib/api";
import { useProjectStore } from "@/lib/store/projectStore";
import { useAuthStore } from "@/lib/store/authStore";
import { getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Layers,
  Sparkles,
  Bug,
  Flame,
  Search,
  Zap,
  ArrowRight,
  Clock,
  User,
  Users,
  Check,
  Copy,
  MessageSquare,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  LayoutList,
  AlignJustify,
} from "lucide-react";
import { cn, PRIORITY_BG, formatDate, generateAvatar } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import toast from "react-hot-toast";
import { CreateBacklogItemModal } from "@/components/backlog/CreateBacklogItemModal";
import { MoveToSprintModal } from "@/components/backlog/MoveToSprintModal";
import { BacklogDetailDrawer } from "@/components/backlog/BacklogDetailDrawer";

const TYPE_CONFIG = {
  story: { label: "FEAT", color: "text-purple-400 bg-purple-500/10 border-purple-500/30", icon: Sparkles },
  task: { label: "TASK", color: "text-blue-400 bg-blue-500/10 border-blue-500/30", icon: Layers },
  bug: { label: "BUG", color: "text-rose-400 bg-rose-500/10 border-rose-500/30", icon: Bug },
  epic: { label: "EPIC", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", icon: Flame },
};

const SEVERITY_BADGES: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export default function BacklogPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentProject, fetchProject } = useProjectStore();
  const { user: currentUser } = useAuthStore();

  const [backlog, setBacklog] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [movingTask, setMovingTask] = useState<any | null>(null);

  // Quick Add input
  const [quickTitle, setQuickTitle] = useState("");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Search & Filters
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"priority" | "newest" | "oldest" | "points">("priority");
  const [viewMode, setViewMode] = useState<"list" | "compact">("list");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchProject(projectId);
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [backlogRes, sprintsRes] = await Promise.all([
        taskAPI.getBacklog(projectId),
        sprintAPI.getAll(projectId),
      ]);
      setBacklog(backlogRes.data || []);
      setSprints((sprintsRes.data || []).filter((s: any) => s.status !== "completed"));
    } catch {
      toast.error("Failed to load backlog");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Real-Time Socket.IO Synchronization ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !projectId) return;

    socket.emit("join:project", { projectId, userId: currentUser?._id });

    const handleTaskCreated = (newTask: any) => {
      if (!newTask.sprint) {
        setBacklog((prev) => {
          const exists = prev.some((i) => i._id === newTask._id);
          if (exists) return prev;
          return [newTask, ...prev];
        });
      }
    };

    const handleTaskMoved = () => {
      loadData();
    };

    socket.on("task:created", handleTaskCreated);
    socket.on("task:moved", handleTaskMoved);
    socket.on("task:updated", handleTaskMoved);

    return () => {
      socket.off("task:created", handleTaskCreated);
      socket.off("task:moved", handleTaskMoved);
      socket.off("task:updated", handleTaskMoved);
    };
  }, [projectId, currentUser?._id]);

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setShowCreateModal(true);
      } else if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setShowCreateModal(false);
        setSelectedTaskId(null);
        setMovingTask(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Quick Add Handler ──
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setIsQuickAdding(true);
    try {
      const { data: newItem } = await taskAPI.create({
        title: quickTitle.trim(),
        type: "story",
        priority: "medium",
        project: projectId,
        status: "todo",
      });
      toast.success("Added to backlog! 🚀");
      setBacklog((prev) => [newItem, ...prev]);
      setQuickTitle("");
    } catch {
      toast.error("Failed to add backlog item");
    } finally {
      setIsQuickAdding(false);
    }
  };

  // ── Backlog Metrics ──
  const metrics = useMemo(() => {
    const total = backlog.length;
    const totalPoints = backlog.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const unassigned = backlog.filter((t) => !t.assignees || t.assignees.length === 0).length;
    const highPriority = backlog.filter((t) => t.priority === "critical" || t.priority === "high").length;
    const bugs = backlog.filter((t) => t.type === "bug").length;
    return { total, totalPoints, unassigned, highPriority, bugs };
  }, [backlog]);

  // ── Filtered & Sorted Backlog ──
  const filteredBacklog = useMemo(() => {
    return backlog
      .filter((task) => {
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const titleMatch = task.title?.toLowerCase().includes(q);
          const descMatch = task.description?.toLowerCase().includes(q);
          const keyMatch = `SFG-${task._id?.slice(-4).toLowerCase()}`.includes(q);
          const reporterMatch = task.reporter?.name?.toLowerCase().includes(q);
          const assigneeMatch = task.assignees?.some((a: any) =>
            a.name?.toLowerCase().includes(q)
          );
          if (!titleMatch && !descMatch && !keyMatch && !reporterMatch && !assigneeMatch) {
            return false;
          }
        }

        if (typeFilter !== "all" && task.type !== typeFilter) return false;
        if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

        if (assigneeFilter === "me") {
          const isAssigned = task.assignees?.some(
            (a: any) => (typeof a === "object" ? a._id : a) === currentUser?._id
          );
          if (!isAssigned) return false;
        } else if (assigneeFilter === "unassigned") {
          if (task.assignees && task.assignees.length > 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          const weight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
          return (weight[b.priority] || 0) - (weight[a.priority] || 0);
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "points") {
          return (b.storyPoints || 0) - (a.storyPoints || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [backlog, searchQuery, typeFilter, priorityFilter, assigneeFilter, sortBy, currentUser?._id]);

  const copyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `SFG-${id.slice(-4).toUpperCase()}`;
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    toast.success(`Copied ${key}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* ── 1. PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Layers className="w-3 h-3" /> Agile Planning
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">
              {currentProject?.name || "TASKDEV"}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">
              {metrics.total} item{metrics.total === 1 ? "" : "s"} waiting
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Product Backlog
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Plan, prioritize, and prepare upcoming engineering work for your team&apos;s sprint cycles.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(124,92,255,0.35)] hover:shadow-[0_0_28px_rgba(124,92,255,0.55)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Backlog</span>
            <span className="hidden sm:inline text-[10px] font-mono opacity-60 bg-black/30 px-1 rounded">
              C
            </span>
          </button>
        </div>
      </div>

      {/* ── 2. BACKLOG METRICS OVERVIEW STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Total Backlog
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white">{metrics.total}</span>
            <span className="text-xs text-slate-500 font-mono">items</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Estimated Load
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-violet-300">
              {metrics.totalPoints}
            </span>
            <span className="text-xs text-slate-500 font-mono">story points</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Unassigned
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400">
              {metrics.unassigned}
            </span>
            <span className="text-xs text-slate-500 font-mono">needs owner</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            High / Critical
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-400">
              {metrics.highPriority}
            </span>
            <span className="text-xs text-slate-500 font-mono">priority items</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Bugs in Backlog
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-300">
              {metrics.bugs}
            </span>
            <span className="text-xs text-slate-500 font-mono">defects</span>
          </div>
        </div>
      </div>

      {/* ── 3. SEARCH & FILTERS TOOLBAR ── */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search backlog by title, ID (SFG-...), reporter, or assignee... (Press '/' to focus)"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/[0.08] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-600 font-sans"
            />
          </div>

          {/* Filter Selectors & View Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="story">Features</option>
              <option value="task">Tasks</option>
              <option value="bug">Bugs</option>
              <option value="epic">Epics</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical (P0)</option>
              <option value="high">High (P1)</option>
              <option value="medium">Medium (P2)</option>
              <option value="low">Low (P3)</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="all">All Assignees</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="priority">Highest Priority</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest Backlog</option>
              <option value="points">Highest Estimate</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#060914] p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  viewMode === "list" ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"
                )}
                title="List View"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  viewMode === "compact" ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"
                )}
                title="Compact View"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Inline Quick Add Bar ── */}
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="+ Quick add item to backlog... (Type title and press Enter)"
            className="flex-1 px-4 py-2 rounded-xl border border-dashed border-white/[0.12] bg-[#090d1f]/60 hover:bg-[#090d1f] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 transition-all placeholder:text-slate-500 font-sans"
          />
          {quickTitle.trim() && (
            <button
              type="submit"
              disabled={isQuickAdding}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_12px_rgba(124,92,255,0.35)] cursor-pointer flex items-center gap-1.5"
            >
              {isQuickAdding ? "Adding..." : "Add Item"}
            </button>
          )}
        </form>
      </div>

      {/* ── 4. BACKLOG DIRECTORY LIST ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredBacklog.length === 0 ? (
        /* ── Empty State ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 rounded-3xl bg-[#090d1f] border border-white/[0.08] text-center space-y-4 shadow-xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your backlog is clear</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              {searchQuery || typeFilter !== "all" || priorityFilter !== "all"
                ? "No backlog items match your current filters. Try resetting your search."
                : "Nothing is waiting to be planned. Capture your next feature, bug, or improvement and decide when it belongs in a sprint."}
            </p>
          </div>
          {searchQuery || typeFilter !== "all" || priorityFilter !== "all" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setPriorityFilter("all");
                setAssigneeFilter("all");
              }}
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(124,92,255,0.4)] cursor-pointer"
              >
                + Add Backlog Item
              </button>

              <div className="pt-4 border-t border-white/[0.04] flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500 flex-wrap">
                <span>IDEA</span>
                <span>→</span>
                <span>BACKLOG</span>
                <span>→</span>
                <span>ESTIMATE</span>
                <span>→</span>
                <span>SPRINT</span>
                <span>→</span>
                <span>SHIP</span>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="divide-y divide-white/[0.04] rounded-3xl border border-white/[0.08] bg-[#090d1f] shadow-lg overflow-hidden">
          {filteredBacklog.map((task) => {
            const key = `SFG-${task._id.slice(-4).toUpperCase()}`;
            const typeInfo =
              TYPE_CONFIG[task.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.story;
            const TypeIcon = typeInfo.icon;
            const isCopied = copiedId === task._id;

            return (
              <div
                key={task._id}
                onClick={() => setSelectedTaskId(task._id)}
                className={cn(
                  "p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group",
                  viewMode === "compact" && "py-3"
                )}
              >
                {/* Left: Task Identity & Title */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Type Icon */}
                  <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TypeIcon className={cn("w-4 h-4", typeInfo.color.split(" ")[0])} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Key badge */}
                      <button
                        onClick={(e) => copyId(task._id, e)}
                        className="text-[11px] font-mono font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                        title="Click to copy ID"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        <span>{key}</span>
                      </button>

                      {/* Type Badge */}
                      <span
                        className={cn(
                          "text-[10px] font-mono font-bold uppercase px-2 py-0.2 rounded border",
                          typeInfo.color
                        )}
                      >
                        {typeInfo.label}
                      </span>

                      {/* Severity / Priority */}
                      <span
                        className={cn(
                          "text-[10px] font-mono font-bold uppercase px-2 py-0.2 rounded border",
                          SEVERITY_BADGES[task.priority] || SEVERITY_BADGES.medium
                        )}
                      >
                        {task.priority}
                      </span>

                      {/* Estimate */}
                      {task.storyPoints ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                          {task.storyPoints} SP
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors leading-snug">
                      {task.title}
                    </h3>

                    {task.description && viewMode === "list" && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-sans">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Assignee, Age & Move to Sprint Action */}
                <div className="flex items-center gap-4 sm:gap-6 text-xs font-mono text-slate-400 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.04]">
                  {/* Assignee */}
                  {task.assignees?.length > 0 ? (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <UserAvatar
                        src={task.assignees[0]?.avatar}
                        name={task.assignees[0]?.name}
                        size="xs"
                        ringClassName="border border-white/[0.1]"
                      />
                      <span className="truncate max-w-[90px]">
                        {task.assignees[0]?.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Unassigned</span>
                  )}

                  {/* Backlog Age */}
                  <span className="text-slate-500">
                    {formatDate(task.createdAt, "relative")}
                  </span>

                  {/* Move to Sprint Action on Hover */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setMovingTask(task)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600/15 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold transition-all opacity-90 group-hover:opacity-100 cursor-pointer"
                      title="Allocate task into an active or planning sprint"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Sprint →</span>
                    </button>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals & Drawers ── */}
      <CreateBacklogItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        projectName={currentProject?.name}
        projectMembers={currentProject?.members}
        sprints={sprints}
        onItemCreated={(newItem) => {
          setBacklog((prev) => [newItem, ...prev]);
        }}
      />

      <MoveToSprintModal
        isOpen={!!movingTask}
        task={movingTask}
        sprints={sprints}
        onClose={() => setMovingTask(null)}
        onTaskMoved={(taskId) => {
          setBacklog((prev) => prev.filter((t) => t._id !== taskId));
        }}
      />

      <BacklogDetailDrawer
        isOpen={!!selectedTaskId}
        taskId={selectedTaskId}
        projectId={projectId}
        projectMembers={currentProject?.members}
        sprints={sprints}
        onClose={() => setSelectedTaskId(null)}
        onItemUpdated={loadData}
        onItemDeleted={loadData}
        onOpenMoveToSprint={(task) => {
          setSelectedTaskId(null);
          setMovingTask(task);
        }}
      />
    </div>
  );
}
