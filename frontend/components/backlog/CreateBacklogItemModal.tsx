"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Layers,
  Sparkles,
  Bug,
  Flame,
  User,
  Calendar,
  Zap,
  Loader2,
  ArrowRight,
  Plus,
} from "lucide-react";
import { taskAPI } from "@/lib/api";
import { generateAvatar, cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface CreateBacklogItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  projectMembers?: any[];
  sprints?: any[];
  onItemCreated: (newItem: any) => void;
}

const ITEM_TYPES = [
  { id: "story", label: "Feature", icon: Sparkles, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  { id: "task", label: "Task", icon: Layers, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { id: "bug", label: "Bug", icon: Bug, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { id: "epic", label: "Epic / Initiative", icon: Flame, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
];

const PRIORITIES = [
  { id: "critical", label: "P0 — Critical", color: "text-rose-400 bg-rose-500/15 border-rose-500/30" },
  { id: "high", label: "P1 — High", color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
  { id: "medium", label: "P2 — Medium", color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
  { id: "low", label: "P3 — Low", color: "text-slate-400 bg-slate-500/15 border-slate-500/30" },
];

export function CreateBacklogItemModal({
  isOpen,
  onClose,
  projectId,
  projectName = "TASKDEV",
  projectMembers = [],
  sprints = [],
  onItemCreated,
}: CreateBacklogItemModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("story");
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [storyPoints, setStoryPoints] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setType("story");
      setPriority("medium");
      setAssigneeId("");
      setStoryPoints("");
      setSprintId("");
      setDueDate("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
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
        status: "todo",
      };

      if (assigneeId) payload.assignees = [assigneeId];
      if (sprintId) payload.sprint = sprintId;
      if (storyPoints) payload.storyPoints = parseInt(storyPoints, 10);
      if (dueDate) payload.dueDate = dueDate;

      const { data: newItem } = await taskAPI.create(payload);
      toast.success(`Backlog item created! 🚀`);
      onItemCreated(newItem);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create backlog item");
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
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-[#090d1f] border border-white/[0.12] rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-4 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Product Backlog
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono text-slate-400">{projectName}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Create Backlog Item
              </h2>
              <p className="text-xs text-slate-400">
                Capture the work now. Plan and prioritize it into sprints when ready.
              </p>
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
                Work Item Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement passwordless authentication with magic links"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all font-medium placeholder:text-slate-600"
              />
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Work Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ITEM_TYPES.map((t) => {
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
                        <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-violet-400" : "text-slate-500")} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITIES.map((p) => {
                    const isSelected = priority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
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
                placeholder="Describe the context, user problem, acceptance criteria, or technical approach..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-600 resize-none font-sans"
              />
            </div>

            {/* Assignee & Sprint Allocation */}
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
                    const u = m.user;
                    if (!u) return null;
                    return (
                      <option key={u._id} value={u._id}>
                        {u.name} ({m.role})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sprint Allocation
                </label>
                <select
                  value={sprintId}
                  onChange={(e) => setSprintId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 cursor-pointer"
                >
                  <option value="">Project Backlog (No sprint)</option>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Story Points Estimate
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  placeholder="e.g. 5 SP"
                  className="w-full px-3.5 py-2 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 placeholder:text-slate-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Due Date (Optional)
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
              className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(124,92,255,0.4)] hover:shadow-[0_0_28px_rgba(124,92,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding to Backlog...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Backlog</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
