"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { issueAPI, taskAPI, sprintAPI } from "@/lib/api";
import { useProjectStore } from "@/lib/store/projectStore";
import { useAuthStore } from "@/lib/store/authStore";
import { getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Bug,
  AlertCircle,
  Search,
  CheckCircle2,
  Flame,
  Clock,
  User,
  Users,
  Filter,
  ArrowUpDown,
  Sparkles,
  Layers,
  Check,
  Copy,
  MessageSquare,
  ChevronRight,
  AlertTriangle,
  Radio,
  ExternalLink,
} from "lucide-react";
import { cn, PRIORITY_BG, formatDate, generateAvatar } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import toast from "react-hot-toast";
import { ReportIssueModal } from "@/components/issues/ReportIssueModal";
import { IssueDetailDrawer } from "@/components/issues/IssueDetailDrawer";

const TYPE_CONFIG = {
  bug: { label: "BUG", color: "text-rose-400 bg-rose-500/10 border-rose-500/30", icon: Bug },
  task: { label: "TASK", color: "text-blue-400 bg-blue-500/10 border-blue-500/30", icon: Layers },
  story: { label: "FEAT", color: "text-purple-400 bg-purple-500/10 border-purple-500/30", icon: Sparkles },
  epic: { label: "EPIC", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", icon: Flame },
};

const SEVERITY_BADGES: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export default function IssuesPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentProject, fetchProject } = useProjectStore();
  const { user: currentUser } = useAuthStore();

  const [issues, setIssues] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Panels
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Search & Filters
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "priority" | "updated">("newest");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    fetchProject(projectId);
    loadIssues();
    sprintAPI
      .getAll(projectId)
      .then((res) => setSprints(res.data || []))
      .catch(() => setSprints([]));
  }, [projectId]);

  const loadIssues = async () => {
    try {
      setIsLoading(true);
      const { data } = await issueAPI.getAll(projectId);
      setIssues(data || []);
    } catch {
      toast.error("Failed to load issues");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Real-Time Socket.IO Listener ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !projectId) return;

    socket.emit("join:project", { projectId, userId: currentUser?._id });

    const handleTaskCreated = (newTask: any) => {
      setIssues((prev) => {
        const exists = prev.some((i) => i._id === newTask._id);
        if (exists) return prev;
        return [newTask, ...prev];
      });
    };

    const handleTaskUpdated = () => {
      loadIssues();
    };

    socket.on("task:created", handleTaskCreated);
    socket.on("task:moved", handleTaskUpdated);
    socket.on("task:updated", handleTaskUpdated);

    return () => {
      socket.off("task:created", handleTaskCreated);
      socket.off("task:moved", handleTaskUpdated);
      socket.off("task:updated", handleTaskUpdated);
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
        setShowReportModal(true);
      } else if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setShowReportModal(false);
        setSelectedIssueId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Issue Metrics ──
  const metrics = useMemo(() => {
    const open = issues.filter((i) => i.status === "todo").length;
    const inProgress = issues.filter((i) => i.status === "in_progress").length;
    const inReview = issues.filter((i) => i.status === "review").length;
    const resolved = issues.filter((i) => i.status === "done").length;
    const critical = issues.filter((i) => i.priority === "critical").length;
    return { open, inProgress, inReview, resolved, critical };
  }, [issues]);

  // ── Filtered & Sorted Issues ──
  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        // Search text
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const titleMatch = issue.title?.toLowerCase().includes(q);
          const descMatch = issue.description?.toLowerCase().includes(q);
          const keyMatch = `SFG-${issue._id?.slice(-4).toLowerCase()}`.includes(q);
          const reporterMatch = issue.reporter?.name?.toLowerCase().includes(q);
          const assigneeMatch = issue.assignees?.some((a: any) =>
            a.name?.toLowerCase().includes(q)
          );
          if (!titleMatch && !descMatch && !keyMatch && !reporterMatch && !assigneeMatch) {
            return false;
          }
        }

        // Status
        if (statusFilter !== "all" && issue.status !== statusFilter) return false;

        // Priority
        if (priorityFilter !== "all" && issue.priority !== priorityFilter) return false;

        // Type
        if (typeFilter !== "all" && issue.type !== typeFilter) return false;

        // Assignee
        if (assigneeFilter === "me") {
          const isAssigned = issue.assignees?.some(
            (a: any) => (typeof a === "object" ? a._id : a) === currentUser?._id
          );
          if (!isAssigned) return false;
        } else if (assigneeFilter === "unassigned") {
          if (issue.assignees && issue.assignees.length > 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          const weight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
          return (weight[b.priority] || 0) - (weight[a.priority] || 0);
        }
        if (sortBy === "updated") {
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [issues, searchQuery, statusFilter, priorityFilter, typeFilter, assigneeFilter, sortBy, currentUser?._id]);

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
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Bug className="w-3 h-3" /> Issue Tracker
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">
              {currentProject?.name || "TASKDEV"}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">
              {metrics.open + metrics.inProgress} active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Issues & Bug Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Track bugs, regressions, and engineering problems across your software project.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(244,63,94,0.35)] hover:shadow-[0_0_28px_rgba(244,63,94,0.55)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Report Issue</span>
            <span className="hidden sm:inline text-[10px] font-mono opacity-60 bg-black/30 px-1 rounded">
              C
            </span>
          </button>
        </div>
      </div>

      {/* ── 2. ISSUE HEALTH METRICS STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Open
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white">{metrics.open}</span>
            <span className="text-xs text-slate-500 font-mono">unresolved</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            In Progress
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400">
              {metrics.inProgress}
            </span>
            <span className="text-xs text-slate-500 font-mono">being fixed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            In Review
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-400">
              {metrics.inReview}
            </span>
            <span className="text-xs text-slate-500 font-mono">under review</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Resolved
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400">
              {metrics.resolved}
            </span>
            <span className="text-xs text-slate-500 font-mono">completed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f] border border-rose-500/20 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[11px] font-mono text-rose-400 uppercase tracking-wider font-bold">
            Critical (P0)
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-400">
              {metrics.critical}
            </span>
            <span className="text-xs text-rose-300/60 font-mono">urgent</span>
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
              placeholder="Search issues by title, ID (SFG-...), reporter, or assignee... (Press '/' to focus)"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/[0.08] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500/70 focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-600 font-sans"
            />
          </div>

          {/* Filter Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-rose-500/50 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="todo">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Resolved</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-rose-500/50 cursor-pointer"
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
              className="px-3 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-rose-500/50 cursor-pointer"
            >
              <option value="all">All Assignees</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-rose-500/50 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="priority">Highest Priority</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. ISSUES DIRECTORY LIST ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        /* ── Empty State ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 rounded-3xl bg-[#090d1f] border border-white/[0.08] text-center space-y-4 shadow-xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No active issues found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "No issues match your current filters. Try resetting your search."
                : "Your issue tracker is clean — no active bugs or regressions are currently open."}
            </p>
          </div>
          {searchQuery || statusFilter !== "all" || priorityFilter !== "all" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setAssigneeFilter("all");
              }}
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          ) : (
            <button
              onClick={() => setShowReportModal(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(244,63,94,0.35)] cursor-pointer"
            >
              Report an Issue
            </button>
          )}
        </motion.div>
      ) : (
        <div className="divide-y divide-white/[0.04] rounded-3xl border border-white/[0.08] bg-[#090d1f] shadow-lg overflow-hidden">
          {filteredIssues.map((issue) => {
            const key = `SFG-${issue._id.slice(-4).toUpperCase()}`;
            const typeInfo =
              TYPE_CONFIG[issue.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.bug;
            const TypeIcon = typeInfo.icon;
            const isCopied = copiedId === issue._id;

            return (
              <div
                key={issue._id}
                onClick={() => setSelectedIssueId(issue._id)}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
              >
                {/* Left: Issue Meta & Title */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Issue Type Icon */}
                  <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TypeIcon className="w-4 h-4 text-rose-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Key badge */}
                      <button
                        onClick={(e) => copyId(issue._id, e)}
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

                      {/* Severity / Priority */}
                      <span
                        className={cn(
                          "text-[10px] font-mono font-bold uppercase px-2 py-0.2 rounded border",
                          SEVERITY_BADGES[issue.priority] || SEVERITY_BADGES.medium
                        )}
                      >
                        {issue.priority}
                      </span>

                      {/* Status */}
                      <span
                        className={cn(
                          "text-[10px] font-mono uppercase px-2 py-0.2 rounded font-semibold",
                          issue.status === "done"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : issue.status === "in_progress"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-white/[0.04] text-slate-400 border border-white/[0.06]"
                        )}
                      >
                        {issue.status?.replace("_", " ")}
                      </span>

                      {/* Sprint */}
                      {issue.sprint?.name && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                          {issue.sprint.name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors leading-snug">
                      {issue.title}
                    </h3>

                    {issue.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {issue.description.replace(/###.*/g, "")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Assignee, Comments & Timestamp */}
                <div className="flex items-center gap-4 sm:gap-6 text-xs font-mono text-slate-400 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.04]">
                  {/* Assignee */}
                  {issue.assignees?.length > 0 ? (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <UserAvatar
                        src={issue.assignees[0]?.avatar}
                        name={issue.assignees[0]?.name}
                        size="xs"
                        ringClassName="border border-white/[0.1]"
                      />
                      <span className="truncate max-w-[100px]">
                        {issue.assignees[0]?.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Unassigned</span>
                  )}

                  {/* Comments counter */}
                  {issue.comments?.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{issue.comments.length}</span>
                    </span>
                  )}

                  {/* Relative date */}
                  <span className="text-slate-500">
                    {formatDate(issue.updatedAt || issue.createdAt, "relative")}
                  </span>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals & Drawers ── */}
      <ReportIssueModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        projectId={projectId}
        projectName={currentProject?.name}
        projectMembers={currentProject?.members}
        sprints={sprints}
        onIssueCreated={(newIssue) => {
          setIssues((prev) => [newIssue, ...prev]);
        }}
      />

      <IssueDetailDrawer
        isOpen={!!selectedIssueId}
        issueId={selectedIssueId}
        projectId={projectId}
        projectMembers={currentProject?.members}
        sprints={sprints}
        onClose={() => setSelectedIssueId(null)}
        onIssueUpdated={loadIssues}
        onIssueDeleted={loadIssues}
      />
    </div>
  );
}
