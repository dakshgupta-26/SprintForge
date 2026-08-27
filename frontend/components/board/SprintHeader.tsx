"use client";

import React from "react";
import { Zap, Calendar, Target, Clock, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface SprintHeaderProps {
  sprint: any | null;
  totalTasks: number;
  inProgressCount: number;
  inReviewCount: number;
  doneCount: number;
  blockedCount: number;
  activeMembers?: any[];
}

export function SprintHeader({
  sprint,
  totalTasks,
  inProgressCount,
  inReviewCount,
  doneCount,
  blockedCount,
}: SprintHeaderProps) {
  if (!sprint) {
    return (
      <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Continuous Flow Board</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                Kanban
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              No active sprint active. Showing all project tasks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span>{totalTasks} total tasks</span>
          <span>•</span>
          <span className="text-amber-400">{inProgressCount} in progress</span>
          <span>•</span>
          <span className="text-emerald-400">{doneCount} done</span>
        </div>
      </div>
    );
  }

  const completionPct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0c1228] to-[#090d1f] border border-violet-500/20 shadow-lg flex-shrink-0 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sprint Title & Info */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.2 rounded-full">
                Active Sprint
              </span>
              <span className="text-sm font-black text-white truncate">
                {sprint.name}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">
                {formatDate(sprint.startDate, "short")} → {formatDate(sprint.endDate, "short")}
              </span>
              <span className="text-xs font-mono font-bold text-violet-300">
                ({daysLeft} day{daysLeft === 1 ? "" : "s"} left)
              </span>
            </div>

            {sprint.goal && (
              <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 font-sans">
                <Target className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span>Goal: {sprint.goal}</span>
              </p>
            )}
          </div>
        </div>

        {/* Compact Metrics Strip */}
        <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-bold">{totalTasks}</span>
            <span className="text-slate-500 text-[11px]">Tasks</span>
          </div>

          <span className="text-slate-700">/</span>

          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">{inProgressCount}</span>
            <span className="text-slate-500 text-[11px]">In Progress</span>
          </div>

          <span className="text-slate-700">/</span>

          <div className="flex items-center gap-1.5">
            <span className="text-blue-400 font-bold">{inReviewCount}</span>
            <span className="text-slate-500 text-[11px]">Review</span>
          </div>

          <span className="text-slate-700">/</span>

          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">{doneCount}</span>
            <span className="text-slate-500 text-[11px]">Done</span>
          </div>

          {blockedCount > 0 && (
            <>
              <span className="text-slate-700">/</span>
              <div className="flex items-center gap-1 text-rose-400 font-bold">
                <AlertTriangle className="w-3 h-3" />
                <span>{blockedCount} Blocked</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>
            Sprint Progress:{" "}
            <strong className="text-white">
              {doneCount}/{totalTasks} tasks completed
            </strong>
          </span>
          <span className="font-bold text-violet-300">{completionPct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
