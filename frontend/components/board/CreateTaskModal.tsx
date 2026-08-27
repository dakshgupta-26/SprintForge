"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Sparkles,
  Layers,
  Bug,
  Flame,
  Calendar,
  User,
  Plus,
} from "lucide-react";
import { taskAPI, issueAPI } from "@/lib/api";
import { generateAvatar, cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface CreateTaskModalProps {
  isOpen?: boolean;
  projectId: string;
  projectName?: string;
  defaultStatus?: string;
  defaultType?: string;
  sprintId?: string;
  sprints?: any[];
  projectMembers?: any[];
  onClose: () => void;
  onCreate?: (task?: any) => void;
}

const TYPE_OPTIONS = [
  { id: "story", label: "Feature", icon: Sparkles, color: "text-purple-400" },
  { id: "task", label: "Task", icon: Layers, color: "text-blue-400" },
  { id: "bug", label: "Bug", icon: Bug, color: "text-rose-400" },
  { id: "epic", label: "Epic", icon: Flame, color: "text-amber-400" },
];

const PRIORITY_OPTIONS = [
  { id: "critical", label: "Critical (P0)", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { id: "high", label: "High (P1)", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { id: "medium", label: "Medium (P2)", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { id: "low", label: "Low (P3)", color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
];

const POINT_PRESETS = [1, 2, 3, 5, 8, 13, 21];

export function CreateTaskModal({
  isOpen = true,
  projectId,
  projectName = "TASKDEV",
  defaultStatus = "todo",
  defaultType = "task",
  sprintId,
  sprints = [],
  projectMembers = [],
  onClose,
  onCreate,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(defaultType);
  const [priority, setPriority] = useState("medium");
  const [selectedSprintId, setSelectedSprintId] = useState(sprintId || "");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setType(defaultType || "task");
    setPriority("medium");
    setSelectedSprintId(sprintId || "");
    setAssigneeId("");
    setDueDate("");
    setStoryPoints("");
  }, [defaultType, sprintId]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (sprintId) setSelectedSprintId(sprintId);
  }, [sprintId]);

  if (!isOpen) return null;

  const estimateAI = () => {
    if (!title.trim()) return;
    const words = (title + " " + description).split(" ").length;
    const complexity = Math.min(Math.ceil(words / 7), 6);
    const pts = [1, 2, 3, 5, 8, 13, 21];
    const estimated = pts[Math.min(complexity - 1, pts.length - 1)] || 3;
    setStoryPoints(estimated);
    toast.success(`AI estimated ${estimated} Story Points! ✨`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        project: projectId,
        status: defaultStatus,
        boardColumn: defaultStatus,
      };

      if (selectedSprintId) payload.sprint = selectedSprintId;
      if (assigneeId) payload.assignees = [assigneeId];
      if (dueDate) payload.dueDate = dueDate;
      if (storyPoints) payload.storyPoints = Number(storyPoints);

      let createdTask: any = null;
      if (type === "bug") {
        const res = await issueAPI.create(payload);
        createdTask = res.data;
      } else {
        const res = await taskAPI.create(payload);
        createdTask = res.data;
      }

      // 1. Reset form state
      resetForm();

      // 2. Notify parent and close modal
      if (onCreate) {
        onCreate(createdTask);
      }
      onClose();

      // 3. Show success toast feedback
      toast.success(type === "bug" ? "Bug reported! 🐞" : "Task created! 🚀");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        {/* Backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-[#090d1f] border border-white/[0.12] rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-4 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Agile Workspace
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono text-slate-400">{projectName}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Create Work Item
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Scroll Area */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Task Title <span className="text-violet-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement JWT refresh token rotation with Redis"
                required
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all font-medium placeholder:text-slate-600"
              />
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Item Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_OPTIONS.map((t) => {
                    const Icon = t.icon;
                    const isSelected = type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                          isSelected
                            ? "bg-white/[0.08] border-white/[0.25] text-white shadow-sm"
                            : "bg-[#060914] border-white/[0.06] text-slate-400 hover:bg-white/[0.03]"
                        )}
                      >
                        <Icon className={cn("w-3.5 h-3.5", t.color)} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITY_OPTIONS.map((p) => {
                    const isSelected = priority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={cn(
                          "flex items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                          isSelected
                            ? p.color
                            : "bg-[#060914] border-white/[0.06] text-slate-400 hover:bg-white/[0.03]"
                        )}
                      >
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description & Acceptance Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe user requirements, technical approach, or acceptance criteria..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-600 resize-none font-sans"
              />
            </div>

            {/* Assignee & Sprint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((m: any) => {
                    const u = m.user || m;
                    if (!u || !u._id) return null;
                    return (
                      <option key={u._id} value={u._id}>
                        {u.name} {m.role ? `(${m.role})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sprint
                </label>
                <select
                  value={selectedSprintId}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 cursor-pointer"
                >
                  <option value="">Project Backlog</option>
                  {sprints.map((s: any) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Story Points & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Story Points
                  </label>
                  <button
                    type="button"
                    onClick={estimateAI}
                    className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Estimate with AI</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {POINT_PRESETS.map((pt) => {
                    const isSelected = storyPoints === pt;
                    return (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setStoryPoints(isSelected ? "" : pt)}
                        className={cn(
                          "w-8 h-8 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer",
                          isSelected
                            ? "bg-violet-600 border-violet-400 text-white shadow-sm"
                            : "bg-[#060914] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        )}
                      >
                        {pt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 cursor-pointer"
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(124,92,255,0.4)] hover:shadow-[0_0_28px_rgba(124,92,255,0.6)] transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Task...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
