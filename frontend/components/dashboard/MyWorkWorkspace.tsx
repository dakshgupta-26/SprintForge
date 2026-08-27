"use client";

import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  Bug,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Copy,
  Check,
  Zap,
  Eye,
} from "lucide-react";
import { formatDate, generateAvatar, cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface MyWorkWorkspaceProps {
  tasks: any[];
  activeFilter: string;
  onFilterChange: (f: string) => void;
  onTaskSelect: (task: any) => void;
  onOpenCreateTask: () => void;
}

const TYPE_CONFIG = {
  story: { label: "FEAT", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  task: { label: "TASK", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  bug: { label: "BUG", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  epic: { label: "EPIC", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
};

const SEVERITY_BADGES: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export function MyWorkWorkspace({
  tasks = [],
  activeFilter,
  onFilterChange,
  onTaskSelect,
  onOpenCreateTask,
}: MyWorkWorkspaceProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const TABS = [
    { id: "all", label: "All Tasks" },
    { id: "today", label: "Due Today" },
    { id: "in_progress", label: "In Progress" },
    { id: "review", label: "In Review" },
    { id: "overdue", label: "Overdue" },
    { id: "completed", label: "Completed" },
  ];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 86400000;

  const filteredTasks = tasks.filter((task) => {
    const dueTime = task.dueDate ? new Date(task.dueDate).getTime() : 0;
    const isCompleted = task.status === "done";

    if (activeFilter === "today") {
      return dueTime >= todayStart && dueTime <= todayEnd && !isCompleted;
    }
    if (activeFilter === "in_progress") {
      return task.status === "in_progress";
    }
    if (activeFilter === "review") {
      return task.status === "review" || task.status === "in_review";
    }
    if (activeFilter === "overdue") {
      return dueTime > 0 && dueTime < todayStart && !isCompleted;
    }
    if (activeFilter === "completed") {
      return isCompleted;
    }
    return true;
  });

  const copyKey = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(key);
    setCopiedId(key);
    toast.success(`Copied ${key}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-xl space-y-4">
      {/* ── Section Header & Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">My Work</h2>
            <p className="text-[11px] text-slate-400">Your assigned engineering work items</p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {TABS.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  isSelected
                    ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,92,255,0.35)]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tasks List ── */}
      {filteredTasks.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-3 rounded-2xl bg-[#060914] border border-dashed border-white/[0.06]">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="max-w-xs mx-auto">
            <h4 className="text-sm font-bold text-white">You're all caught up! ✨</h4>
            <p className="text-xs text-slate-400 mt-1">
              {activeFilter === "today"
                ? "No tasks are due today. Check upcoming work or create a new task."
                : activeFilter === "overdue"
                ? "No overdue tasks. Great job staying on track!"
                : "No tasks found for this view."}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            {activeFilter !== "all" && (
              <button
                onClick={() => onFilterChange("all")}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                View all tasks
              </button>
            )}
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(124,92,255,0.3)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredTasks.map((task) => {
            const taskKey = `SFG-${task._id?.slice(-4).toUpperCase()}`;
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate).getTime() < todayStart &&
              task.status !== "done";
            const isDueToday =
              task.dueDate &&
              new Date(task.dueDate).getTime() >= todayStart &&
              new Date(task.dueDate).getTime() <= todayEnd &&
              task.status !== "done";

            const typeInfo =
              TYPE_CONFIG[task.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.task;

            return (
              <div
                key={task._id}
                onClick={() => onTaskSelect(task)}
                className="p-3 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-violet-500/40 hover:bg-[#0c1228] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-sm"
              >
                {/* Left info: Key, Type, Title, Project */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={(e) => copyKey(e, taskKey)}
                    className="text-[10px] font-mono font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
                    title="Click to copy ID"
                  >
                    {copiedId === taskKey ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <span className="group-hover:text-violet-300">{taskKey}</span>
                    )}
                  </button>

                  <span
                    className={cn(
                      "text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border flex-shrink-0",
                      typeInfo.color
                    )}
                  >
                    {typeInfo.label}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h4
                      className={cn(
                        "text-xs sm:text-sm font-bold truncate group-hover:text-violet-200 transition-colors",
                        task.status === "done" ? "line-through text-slate-500" : "text-white"
                      )}
                    >
                      {task.title}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      {task.project?.name || "SprintForge"}
                    </span>
                  </div>
                </div>

                {/* Right metadata: Priority, Due Date, Points, Status */}
                <div className="flex items-center gap-2.5 font-mono text-xs text-slate-400 flex-shrink-0 self-end sm:self-auto">
                  {/* Due Date Indicator */}
                  {task.dueDate && (
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border",
                        isOverdue
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold"
                          : isDueToday
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold"
                          : "bg-white/[0.02] text-slate-400 border-white/[0.06]"
                      )}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatDate(task.dueDate, "short")}</span>
                    </span>
                  )}

                  {/* Priority */}
                  <span
                    className={cn(
                      "text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border",
                      SEVERITY_BADGES[task.priority] || SEVERITY_BADGES.medium
                    )}
                  >
                    {task.priority}
                  </span>

                  {/* Story Points */}
                  {task.storyPoints ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {task.storyPoints} SP
                    </span>
                  ) : null}

                  {/* Status Indicator */}
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      task.status === "done"
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                        : task.status === "in_progress"
                        ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]"
                        : task.status === "review"
                        ? "bg-violet-400"
                        : "bg-slate-500"
                    )}
                    title={`Status: ${task.status}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
