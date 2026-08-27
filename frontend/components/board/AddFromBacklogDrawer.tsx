"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Layers,
  FolderDown,
  Plus,
  Loader2,
  CheckCircle2,
  Sparkles,
  Bug,
  Flame,
} from "lucide-react";
import { taskAPI, sprintAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface AddFromBacklogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  sprintId: string;
  sprintName?: string;
  onTaskAddedToSprint: () => void;
}

export function AddFromBacklogDrawer({
  isOpen,
  onClose,
  projectId,
  sprintId,
  sprintName = "Active Sprint",
  onTaskAddedToSprint,
}: AddFromBacklogDrawerProps) {
  const [backlogTasks, setBacklogTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingTaskId, setAddingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      loadBacklog();
    }
  }, [isOpen, projectId]);

  const loadBacklog = async () => {
    try {
      setIsLoading(true);
      const { data } = await taskAPI.getBacklog(projectId);
      setBacklogTasks(data || []);
    } catch {
      toast.error("Failed to load backlog tasks");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleAdd = async (taskId: string) => {
    setAddingTaskId(taskId);
    try {
      await sprintAPI.addTask(sprintId, taskId);
      setBacklogTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success("Task added to sprint! 🚀");
      onTaskAddedToSprint();
    } catch {
      toast.error("Failed to add task to sprint");
    } finally {
      setAddingTaskId(null);
    }
  };

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
          className="relative w-full max-w-lg bg-[#090d1f] border-l border-white/[0.12] shadow-2xl flex flex-col h-full z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-4 flex-shrink-0">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                Sprint Planning
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight mt-1">
                Add from Backlog
              </h2>
              <p className="text-xs text-slate-400">
                Pull pending backlog items into {sprintName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
              </div>
            ) : backlogTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-white/[0.06] rounded-2xl">
                No backlog items available to pull. All project tasks are currently allocated.
              </div>
            ) : (
              <div className="space-y-2.5">
                {backlogTasks.map((task) => {
                  const key = `SFG-${task._id.slice(-4).toUpperCase()}`;
                  const isAdding = addingTaskId === task._id;

                  return (
                    <div
                      key={task._id}
                      className="p-3.5 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-violet-500/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-violet-400">
                            {key}
                          </span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border bg-white/[0.04] text-slate-400 border-white/[0.06]">
                            {task.type}
                          </span>
                          {task.storyPoints && (
                            <span className="text-[10px] font-mono font-bold text-slate-300">
                              {task.storyPoints} SP
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">
                          {task.title}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleAdd(task._id)}
                        disabled={isAdding}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(124,92,255,0.35)] cursor-pointer disabled:opacity-50 flex-shrink-0"
                      >
                        {isAdding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>Pull</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
