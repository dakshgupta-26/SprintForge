"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bug,
  Flame,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Edit2,
  CornerDownRight,
  Lightbulb,
  Tag,
  Shield,
} from "lucide-react";
import { taskAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { getSocket } from "@/lib/socket";
import { generateAvatar, formatDate, cn, PRIORITY_BG } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import toast from "react-hot-toast";

interface IssueDetailDrawerProps {
  isOpen: boolean;
  issueId: string | null;
  projectId: string;
  projectMembers?: any[];
  sprints?: any[];
  onClose: () => void;
  onIssueUpdated: () => void;
  onIssueDeleted: () => void;
}

const LIFECYCLE_STEPS = [
  { id: "todo", label: "Open / Triage" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "In Review" },
  { id: "done", label: "Resolved" },
];

export function IssueDetailDrawer({
  isOpen,
  issueId,
  projectId,
  projectMembers = [],
  sprints = [],
  onClose,
  onIssueUpdated,
  onIssueDeleted,
}: IssueDetailDrawerProps) {
  const { user: currentUser } = useAuthStore();
  const [issue, setIssue] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Comments
  const [commentText, setCommentText] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Copy state
  const [idCopied, setIdCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Suggestions state
  const [suggestionText, setSuggestionText] = useState("");
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false);

  // Load issue details
  const loadIssue = async () => {
    if (!issueId) return;
    try {
      setIsLoading(true);
      const { data } = await taskAPI.getOne(issueId);
      setIssue(data);
    } catch {
      toast.error("Failed to load issue details");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && issueId) {
      loadIssue();
      setShowDeleteConfirm(false);
    }
  }, [isOpen, issueId]);

  // Real-time socket comment listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !issueId) return;

    socket.emit("task:join", issueId);

    const handleCommentAdded = (newComment: any) => {
      setIssue((prev: any) => {
        if (!prev) return prev;
        const exists = prev.comments?.some((c: any) => c._id === newComment._id);
        if (exists) return prev;
        return {
          ...prev,
          comments: [...(prev.comments || []), newComment],
        };
      });
    };

    socket.on("comment:added", handleCommentAdded);

    return () => {
      socket.off("comment:added", handleCommentAdded);
    };
  }, [issueId]);

  if (!isOpen || !issueId) return null;

  const copyIssueId = () => {
    const key = `SFG-${issueId.slice(-4).toUpperCase()}`;
    navigator.clipboard.writeText(key);
    setIdCopied(true);
    toast.success(`Copied ${key} to clipboard!`);
    setTimeout(() => setIdCopied(false), 2000);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await taskAPI.updateStatus(issueId, {
        status: newStatus,
        boardColumn: newStatus,
      });
      setIssue((prev: any) => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      onIssueUpdated();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleUpdateAssignee = async (newAssigneeId: string) => {
    try {
      await taskAPI.update(issueId, {
        assignees: newAssigneeId ? [newAssigneeId] : [],
      });
      loadIssue();
      toast.success("Assignee updated");
      onIssueUpdated();
    } catch {
      toast.error("Failed to update assignee");
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    try {
      await taskAPI.update(issueId, { priority: newPriority });
      setIssue((prev: any) => ({ ...prev, priority: newPriority }));
      toast.success(`Priority set to ${newPriority}`);
      onIssueUpdated();
    } catch {
      toast.error("Failed to update priority");
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSendingComment(true);
    try {
      const { data: newComment } = await taskAPI.addComment(issueId, {
        content: commentText.trim(),
      });
      setIssue((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
      }));
      setCommentText("");
      toast.success("Comment posted");
      onIssueUpdated();
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleAddSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim()) return;

    setIsAddingSuggestion(true);
    try {
      const formatted = `💡 **Suggested Solution:**\n${suggestionText.trim()}`;
      const { data: newComment } = await taskAPI.addComment(issueId, {
        content: formatted,
      });
      setIssue((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
      }));
      setSuggestionText("");
      toast.success("Engineering suggestion shared! 💡");
      onIssueUpdated();
    } catch {
      toast.error("Failed to add suggestion");
    } finally {
      setIsAddingSuggestion(false);
    }
  };

  const handleDeleteIssue = async () => {
    setIsDeleting(true);
    try {
      await taskAPI.delete(issueId);
      toast.success("Issue deleted");
      onIssueDeleted();
      onClose();
    } catch {
      toast.error("Failed to delete issue");
    } finally {
      setIsDeleting(false);
    }
  };

  const issueKey = `SFG-${issueId.slice(-4).toUpperCase()}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm overflow-hidden">
        {/* Backdrop click */}
        <div className="flex-1" onClick={onClose} />

        {/* Slide-Over Drawer Container */}
        <motion.div
          initial={{ x: "100%", opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-[#090d1f] border-l border-white/[0.12] shadow-2xl flex flex-col h-full z-10 overflow-hidden"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={copyIssueId}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Click to copy ID"
              >
                {idCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{issueKey}</span>
              </button>

              <span className="text-slate-600">•</span>

              <span
                className={cn(
                  "text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border",
                  issue?.type === "bug"
                    ? "text-rose-400 bg-rose-500/10 border-rose-500/25"
                    : "text-violet-400 bg-violet-500/10 border-violet-500/25"
                )}
              >
                {issue?.type || "BUG"}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
            </div>
          ) : issue ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* ── 1. TITLE & DESCRIPTION ── */}
              <div className="space-y-3">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                  {issue.title}
                </h1>

                {issue.description ? (
                  <div className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {issue.description}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No description provided for this issue.
                  </p>
                )}
              </div>

              {/* ── 2. ENGINEERING LIFECYCLE RAIL ── */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <p className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  Issue Lifecycle Status
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {LIFECYCLE_STEPS.map((step, idx) => {
                    const isActive = issue.status === step.id;
                    return (
                      <button
                        key={step.id}
                        onClick={() => handleUpdateStatus(step.id)}
                        className={cn(
                          "py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold text-center transition-all cursor-pointer border",
                          isActive
                            ? "bg-rose-600/20 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                            : "bg-[#060914] border-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                        )}
                      >
                        {step.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── 3. METADATA ATTRIBUTES GRID ── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#060914] border border-white/[0.06]">
                {/* Assignee */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Assignee
                  </label>
                  <select
                    value={issue.assignees?.[0]?._id || issue.assignees?.[0] || ""}
                    onChange={(e) => handleUpdateAssignee(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-white border-0 focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#090d1f] text-slate-400">
                      Unassigned
                    </option>
                    {projectMembers.map((m: any) => {
                      const u = m.user;
                      if (!u) return null;
                      return (
                        <option
                          key={u._id}
                          value={u._id}
                          className="bg-[#090d1f] text-white"
                        >
                          {u.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={issue.priority || "medium"}
                    onChange={(e) => handleUpdatePriority(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-white border-0 focus:outline-none cursor-pointer capitalize"
                  >
                    <option value="critical" className="bg-[#090d1f] text-rose-400">
                      Critical (P0)
                    </option>
                    <option value="high" className="bg-[#090d1f] text-amber-400">
                      High (P1)
                    </option>
                    <option value="medium" className="bg-[#090d1f] text-blue-400">
                      Medium (P2)
                    </option>
                    <option value="low" className="bg-[#090d1f] text-slate-400">
                      Low (P3)
                    </option>
                  </select>
                </div>

                {/* Reporter */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Reported By
                  </label>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                    <UserAvatar
                      src={issue.reporter?.avatar}
                      name={issue.reporter?.name}
                      size="xs"
                    />
                    <span className="truncate">{issue.reporter?.name || "System"}</span>
                  </div>
                </div>

                {/* Sprint */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Sprint
                  </label>
                  <span className="text-xs font-mono font-bold text-violet-300">
                    {issue.sprint?.name || "Backlog"}
                  </span>
                </div>

                {/* Created Date */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Reported
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {formatDate(issue.createdAt, "short")}
                  </span>
                </div>

                {/* Story Points */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Points
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {issue.storyPoints ? `${issue.storyPoints} SP` : "—"}
                  </span>
                </div>
              </div>

              {/* ── 4. SUGGESTED FIXES / SOLUTIONS ── */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Propose Fix / Solution</span>
                </div>
                <form onSubmit={handleAddSuggestion} className="space-y-2">
                  <textarea
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    placeholder="Suggest a root-cause fix, PR link, or code patch..."
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none font-mono"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingSuggestion || !suggestionText.trim()}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {isAddingSuggestion ? "Posting..." : "Share Fix Suggestion"}
                    </button>
                  </div>
                </form>
              </div>

              {/* ── 5. DISCUSSION & COMMENTS ── */}
              <div className="space-y-4 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                  <span>Discussion ({issue.comments?.length || 0})</span>
                </div>

                <div className="space-y-3">
                  {issue.comments?.map((c: any) => {
                    const author = c.author;
                    return (
                      <div
                        key={c._id}
                        className="p-3.5 rounded-2xl bg-[#060914] border border-white/[0.06] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              src={author?.avatar}
                              name={author?.name}
                              size="xs"
                            />
                            <span className="font-bold text-white">
                              {author?.name || "Teammate"}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">
                            {formatDate(c.createdAt, "relative")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-7 whitespace-pre-wrap">
                          {c.content}
                        </p>
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />
                </div>

                {/* Comment Input */}
                <form onSubmit={handleSendComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment or investigation note... (Enter to send)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70"
                  />
                  <button
                    type="submit"
                    disabled={isSendingComment || !commentText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSendingComment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </form>
              </div>

              {/* ── 6. DANGER ZONE / ACTIONS ── */}
              <div className="pt-4 border-t border-white/[0.06]">
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete this issue</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-3">
                    <span className="text-xs text-rose-300">
                      Permanently delete this issue?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteIssue}
                        disabled={isDeleting}
                        className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold"
                      >
                        {isDeleting ? "Deleting..." : "Confirm"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
