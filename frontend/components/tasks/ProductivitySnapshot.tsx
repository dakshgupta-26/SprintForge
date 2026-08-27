"use client";

import React, { useMemo } from "react";
import {
  Sparkles,
  ArrowRight,
  Flame,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/lib/statusConfig";

interface ProductivitySnapshotProps {
  tasks: any[];
  onSelectTask: (taskId: string) => void;
}

export function ProductivitySnapshot({
  tasks,
  onSelectTask,
}: ProductivitySnapshotProps) {
  // 1. Calculate suggested next task
  const suggestedTask = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    const activeTasks = tasks.filter((t) => t.status !== "done");
    if (activeTasks.length === 0) return null;

    // Prioritize: In Progress with High/Critical priority > Overdue > High Priority > Closest Due Date
    const sorted = [...activeTasks].sort((a, b) => {
      const priorityWeight: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      const pA = priorityWeight[a.priority] || 1;
      const pB = priorityWeight[b.priority] || 1;

      // Status weight (in_progress preferred)
      const sA = a.status === "in_progress" ? 2 : 1;
      const sB = b.status === "in_progress" ? 2 : 1;

      if (sA !== sB) return sB - sA;
      if (pA !== pB) return pB - pA;

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return 0;
    });

    return sorted[0];
  }, [tasks]);

  // 2. Blocked tasks check
  const blockedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "blocked");
  }, [tasks]);

  // 3. Weekly Activity Distribution (Last 7 Days)
  const weekDays = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const currentDayIdx = (now.getDay() + 6) % 7; // 0=Mon, 6=Sun

    return days.map((day, idx) => {
      const isToday = idx === currentDayIdx;
      const isPast = idx < currentDayIdx;
      return {
        label: day,
        isToday,
        isPast,
      };
    });
  }, []);

  const totalActive = tasks.filter((t) => t.status !== "done").length;
  const totalCompleted = tasks.filter((t) => t.status === "done").length;

  if (tasks.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
      {/* Suggested Next Task Card (8 cols) */}
      {suggestedTask ? (
        <div className="lg:col-span-8 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-violet-950/30 via-[#0a0f28] to-[#080d1f] border border-violet-500/25 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-300">
                Recommended Next Focus
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {suggestedTask.project?.name && (
                <span className="text-[10px] font-mono text-slate-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full">
                  {suggestedTask.project.name}
                </span>
              )}
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200 border border-violet-500/30">
                {suggestedTask.priority}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1 leading-snug">
              {suggestedTask.title}
            </h3>
            <p className="text-xs text-slate-400 font-sans line-clamp-1">
              {suggestedTask.description || "High impact task ready for your active focus."}
            </p>
          </div>

          <div className="pt-3.5 mt-2 border-t border-white/[0.06] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              {suggestedTask.storyPoints && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{suggestedTask.storyPoints} Story Points</span>
                </span>
              )}
              {suggestedTask.dueDate && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3 text-violet-400" />
                  <span>Due {new Date(suggestedTask.dueDate).toLocaleDateString()}</span>
                </span>
              )}
            </div>

            <button
              onClick={() => onSelectTask(suggestedTask._id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(124,92,255,0.4)] transition-all cursor-pointer"
            >
              <span>Open Work Item</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="lg:col-span-8 p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              All Assigned Tasks Completed! 🎉
            </h3>
            <p className="text-xs text-slate-400">
              You are completely caught up. Pick up work from the Product Backlog or review team PRs.
            </p>
          </div>
        </div>
      )}

      {/* Blocked or Weekly Pulse Mini Card (4 cols) */}
      <div className="lg:col-span-4 p-4 sm:p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-sm flex flex-col justify-between space-y-3">
        {blockedTasks.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-mono font-bold uppercase">
                {blockedTasks.length} Blocked {blockedTasks.length === 1 ? "Item" : "Items"}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {blockedTasks[0].title}
            </p>
            <p className="text-[11px] text-slate-500">
              Requires dependency resolution or teammate unblock
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-indigo-400" /> Weekly Rhythm
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {totalCompleted} Done • {totalActive} Active
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {weekDays.map((d) => (
                <div
                  key={d.label}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-xl border text-center transition-all",
                    d.isToday
                      ? "bg-violet-600/20 border-violet-500/50 text-white font-bold"
                      : d.isPast
                      ? "bg-white/[0.03] border-white/[0.06] text-slate-300"
                      : "bg-transparent border-white/[0.04] text-slate-500"
                  )}
                >
                  <span className="text-[9px] font-mono">{d.label}</span>
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1",
                      d.isToday ? "bg-violet-400 shadow-[0_0_6px_#a78bfa]" : "bg-white/[0.15]"
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Active Sprint Velocity</span>
          <span className="text-white font-bold">
            {tasks.reduce((acc, t) => acc + (t.status === "done" ? t.storyPoints || 0 : 0), 0)} SP Delivered
          </span>
        </div>
      </div>
    </div>
  );
}
