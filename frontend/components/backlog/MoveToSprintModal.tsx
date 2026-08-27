"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Zap,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { sprintAPI } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface MoveToSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any; // The task being moved
  sprints: any[]; // Non-completed sprints
  onTaskMoved: (taskId: string, sprintId: string) => void;
}

export function MoveToSprintModal({
  isOpen,
  onClose,
  task,
  sprints = [],
  onTaskMoved,
}: MoveToSprintModalProps) {
  const [selectedSprintId, setSelectedSprintId] = useState<string>(
    sprints[0]?._id || ""
  );
  const [isMoving, setIsMoving] = useState(false);

  if (!isOpen || !task) return null;

  const handleMove = async () => {
    if (!selectedSprintId) {
      toast.error("Please select a target sprint");
      return;
    }

    setIsMoving(true);
    try {
      await sprintAPI.addTask(selectedSprintId, task._id);
      const targetSprint = sprints.find((s) => s._id === selectedSprintId);
      toast.success(
        `Moved to ${targetSprint?.name || "Sprint"} successfully! 🚀`
      );
      onTaskMoved(task._id, selectedSprintId);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to move task to sprint");
    } finally {
      setIsMoving(false);
    }
  };

  const taskKey = `SFG-${task._id.slice(-4).toUpperCase()}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-md">
        {/* Backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#090d1f] border border-white/[0.12] rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden z-10 my-auto flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                Sprint Allocation
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight mt-1">
                Move Item to Sprint
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Task Info Pill */}
            <div className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-violet-300">
                  {taskKey}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono text-slate-400">
                  {task.storyPoints ? `${task.storyPoints} SP` : "No estimate"}
                </span>
              </div>
              <p className="text-sm font-bold text-white truncate">{task.title}</p>
            </div>

            {/* Sprints List Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Target Sprint
              </label>

              {sprints.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-xs text-slate-400">
                  No active or planning sprints found. Please create a sprint first.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {sprints.map((sprint) => {
                    const isSelected = selectedSprintId === sprint._id;
                    const isActive = sprint.status === "active";
                    return (
                      <div
                        key={sprint._id}
                        onClick={() => setSelectedSprintId(sprint._id)}
                        className={cn(
                          "p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3",
                          isSelected
                            ? "bg-violet-600/15 border-violet-500/50 shadow-[0_0_15px_rgba(124,92,255,0.2)]"
                            : "bg-[#060914] border-white/[0.06] hover:bg-white/[0.03]"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold text-white truncate">
                              {sprint.name}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-mono font-bold px-2 py-0.2 rounded-full uppercase",
                                isActive
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              )}
                            >
                              {sprint.status}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-500">
                            {formatDate(sprint.startDate, "short")} →{" "}
                            {formatDate(sprint.endDate, "short")} •{" "}
                            {sprint.tasks?.length || 0} issues allocated
                          </p>
                        </div>

                        <div
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center border transition-all flex-shrink-0",
                            isSelected
                              ? "bg-violet-600 border-violet-400 text-white"
                              : "border-white/[0.15] bg-white/[0.02]"
                          )}
                        >
                          {isSelected && <Zap className="w-3 h-3 fill-current" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

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
              onClick={handleMove}
              disabled={isMoving || !selectedSprintId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(124,92,255,0.4)] hover:shadow-[0_0_28px_rgba(124,92,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              {isMoving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Moving to Sprint...</span>
                </>
              ) : (
                <>
                  <span>Move to Sprint</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
