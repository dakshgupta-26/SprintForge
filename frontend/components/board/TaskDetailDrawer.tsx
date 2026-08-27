"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Layers,
  Sparkles,
  Bug,
  Flame,
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
  Zap,
  Edit2,
  Tag,
} from "lucide-react";
import { taskAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { getSocket } from "@/lib/socket";
import { generateAvatar, formatDate, cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface TaskDetailDrawerProps {
  isOpen: boolean;
  taskId: string | null;
  projectId: string;
  projectMembers?: any[];
  sprints?: any[];
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

const LIFECYCLE_STAGES = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "In Review" },
  { id: "done", label: "Done" },
];

export function TaskDetailDrawer({
  isOpen,
  taskId,
  projectId,
  projectMembers = [],
  sprints = [],
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailDrawerProps) {
  const { user: currentUser } = useAuthStore();
  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit mode
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");

  // Comments
  const [commentText, setCommentText] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Subtask input
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Copy & Delete
  const [idCopied, setIdCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadTask = async () => {
    if (!taskId) return;
    try {
      setIsLoading(true);
      const { data } = await taskAPI.getOne(taskId);
      setTask(data);
      setTitleInput(data.title || "");
      setDescInput(data.description || "");
    } catch {
      toast.error("Failed to load task details");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      loadTask();
      setShowDeleteConfirm(false);
    }
  }, [isOpen, taskId]);

  // Real-time socket comment listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !taskId) return;

    socket.emit("task:join", taskId);

    const handleCommentAdded = (newComment: any) => {
      setTask((prev: any) => {
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
  }, [taskId]);

  if (!isOpen || !taskId) return null;

  const copyTaskId = () => {
    const key = `SFG-${taskId.slice(-4).toUpperCase()}`;
    navigator.clipboard.writeText(key);
    setIdCopied(true);
    toast.success(`Copied ${key}`);
    setTimeout(() => setIdCopied(false), 2000);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await taskAPI.updateStatus(taskId, {
        status: newStatus,
        boardColumn: newStatus,
      });
      setTask((prev: any) => ({ ...prev, status: newStatus, boardColumn: newStatus }));
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      onTaskUpdated();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    try {
      await taskAPI.update(taskId, { priority: newPriority });
      setTask((prev: any) => ({ ...prev, priority: newPriority }));
      toast.success(`Priority set to ${newPriority}`);
      onTaskUpdated();
    } catch {
      toast.error("Failed to update priority");
    }
  };

  const handleUpdateAssignee = async (newAssigneeId: string) => {
    try {
      await taskAPI.update(taskId, {
        assignees: newAssigneeId ? [newAssigneeId] : [],
      });
      loadTask();
      toast.success("Assignee updated");
      onTaskUpdated();
    } catch {
      toast.error("Failed to update assignee");
    }
  };

  const handleUpdatePoints = async (points: string) => {
    const num = parseInt(points, 10);
    if (isNaN(num) || num < 0) return;
    try {
      await taskAPI.update(taskId, { storyPoints: num });
      setTask((prev: any) => ({ ...prev, storyPoints: num }));
      toast.success(`Points updated to ${num} SP`);
      onTaskUpdated();
    } catch {
      toast.error("Failed to update story points");
    }
  };

  const handleSaveTitle = async () => {
    if (!titleInput.trim() || titleInput === task.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await taskAPI.update(taskId, { title: titleInput.trim() });
      setTask((prev: any) => ({ ...prev, title: titleInput.trim() }));
      setIsEditingTitle(false);
      toast.success("Title updated");
      onTaskUpdated();
    } catch {
      toast.error("Failed to update title");
    }
  };

  const handleSaveDesc = async () => {
    try {
      await taskAPI.update(taskId, { description: descInput.trim() });
      setTask((prev: any) => ({ ...prev, description: descInput.trim() }));
      setIsEditingDesc(false);
      toast.success("Description updated");
      onTaskUpdated();
    } catch {
      toast.error("Failed to update description");
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSendingComment(true);
    try {
      const { data: newComment } = await taskAPI.addComment(taskId, {
        content: commentText.trim(),
      });
      setTask((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
      }));
      setCommentText("");
      toast.success("Comment posted");
      onTaskUpdated();
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await taskAPI.delete(taskId);
      toast.success("Task deleted");
      onTaskDeleted();
      onClose();
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const taskKey = `SFG-${taskId.slice(-4).toUpperCase()}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm overflow-hidden">
        {/* Backdrop */}
        <div className="flex-1" onClick={onClose} />

        {/* Drawer Window */}
        <motion.div
          initial={{ x: "100%", opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-xl bg-[#090d1f] border-l border-white/[0.12] shadow-2xl flex flex-col h-full z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={copyTaskId}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Click to copy ID"
              >
                {idCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{taskKey}</span>
              </button>

              <span className="text-slate-600">•</span>

              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border text-violet-400 bg-violet-500/10 border-violet-500/25">
                {task?.type || "TASK"}
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
              <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            </div>
          ) : task ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* ── 1. TITLE & DESCRIPTION ── */}
              <div className="space-y-3">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                      autoFocus
                      className="w-full text-lg font-bold text-white bg-[#060914] border border-violet-500/60 rounded-xl px-3 py-1.5 focus:outline-none"
                    />
                  </div>
                ) : (
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug hover:text-violet-200 transition-colors cursor-pointer group"
                    title="Click to edit title"
                  >
                    {task.title}
                    <Edit2 className="w-3.5 h-3.5 inline ml-2 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h1>
                )}

                {isEditingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      rows={4}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#060914] border border-violet-500/60 text-xs sm:text-sm text-white focus:outline-none resize-none font-sans"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingDesc(false)}
                        className="px-3 py-1 text-xs text-slate-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDesc}
                        className="px-3 py-1 rounded-xl bg-violet-600 text-white text-xs font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDesc(true)}
                    className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans cursor-pointer hover:border-white/[0.12] transition-colors group"
                    title="Click to edit description"
                  >
                    {task.description || "Click to add a description..."}
                  </div>
                )}
              </div>

              {/* ── 2. LIFECYCLE STATUS RAIL ── */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <p className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  Agile Task Lifecycle
                </p>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {LIFECYCLE_STAGES.map((stage) => {
                    const isCurrent = (task.status || "todo") === stage.id;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => handleUpdateStatus(stage.id)}
                        className={cn(
                          "py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold border transition-all cursor-pointer",
                          isCurrent
                            ? "bg-violet-600/20 border-violet-500/60 text-violet-300 shadow-[0_0_12px_rgba(124,92,255,0.25)]"
                            : "bg-[#060914] border-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                        )}
                      >
                        {stage.label}
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
                    value={task.assignees?.[0]?._id || task.assignees?.[0] || ""}
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
                        <option key={u._id} value={u._id} className="bg-[#090d1f] text-white">
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
                    value={task.priority || "medium"}
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

                {/* Story Points */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Story Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={task.storyPoints || ""}
                    onBlur={(e) => handleUpdatePoints(e.target.value)}
                    placeholder="Estimate SP..."
                    className="w-full bg-transparent text-xs font-mono font-bold text-violet-300 border-0 focus:outline-none placeholder:text-slate-600"
                  />
                </div>

                {/* Sprint Allocation */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Sprint
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-300 truncate block">
                    {task.sprint?.name || "Sprint Allocated"}
                  </span>
                </div>

                {/* Created Date */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Created
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {formatDate(task.createdAt, "relative")}
                  </span>
                </div>

                {/* Reporter */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Reporter
                  </label>
                  <span className="text-xs text-slate-300 font-medium truncate block">
                    {task.reporter?.name || "System"}
                  </span>
                </div>
              </div>

              {/* ── 4. DISCUSSION & COMMENTS ── */}
              <div className="space-y-4 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                  <span>Discussion ({task.comments?.length || 0})</span>
                </div>

                <div className="space-y-3">
                  {task.comments?.map((c: any) => {
                    const author = c.author;
                    return (
                      <div
                        key={c._id}
                        className="p-3.5 rounded-2xl bg-[#060914] border border-white/[0.06] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                author?.avatar ||
                                generateAvatar(author?.name || "U")
                              }
                              alt=""
                              className="w-5 h-5 rounded-full object-cover"
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
                    placeholder="Write a comment or status update... (Enter to send)"
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

              {/* ── 5. DANGER ZONE ── */}
              <div className="pt-4 border-t border-white/[0.06]">
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete this task</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-3">
                    <span className="text-xs text-rose-300">
                      Permanently delete this task?
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
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
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
