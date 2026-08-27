"use client";

import React from "react";
import { CheckCircle2, Clock, Zap, AlertTriangle, Layers, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskStatsProps {
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
  highPriority: number;
}

export function TaskStats({
  total,
  inProgress,
  completed,
  overdue,
  dueToday,
  highPriority,
}: TaskStatsProps) {
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
      {/* 1. Total Tasks */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0d132b] to-[#080d1f] border border-white/[0.08] hover:border-white/[0.16] transition-all shadow-sm flex items-center justify-between group">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Total Assigned
          </p>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {total}
          </p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Across all projects</span>
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform flex-shrink-0">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      {/* 2. In Progress */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0d132b] to-[#080d1f] border border-white/[0.08] hover:border-indigo-500/30 transition-all shadow-sm flex items-center justify-between group">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            In Progress
          </p>
          <p className="text-2xl sm:text-3xl font-black text-indigo-400 tracking-tight">
            {inProgress}
          </p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            {dueToday > 0 ? (
              <span className="text-amber-400 font-bold">{dueToday} due today</span>
            ) : (
              <span>Active focus</span>
            )}
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform flex-shrink-0">
          <Zap className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Completed */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0d132b] to-[#080d1f] border border-white/[0.08] hover:border-emerald-500/30 transition-all shadow-sm flex items-center justify-between group">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Completed
          </p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
            {completed}
          </p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-bold">{completionRate}%</span> resolution rate
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Overdue / Urgent Attention */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0d132b] to-[#080d1f] border border-white/[0.08] hover:border-rose-500/30 transition-all shadow-sm flex items-center justify-between group">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Urgent / Overdue
          </p>
          <p
            className={cn(
              "text-2xl sm:text-3xl font-black tracking-tight",
              overdue > 0 ? "text-rose-400" : "text-slate-300"
            )}
          >
            {overdue}
          </p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            {overdue > 0 ? (
              <span className="text-rose-400 font-bold">Needs immediate action</span>
            ) : (
              <span className="text-slate-500">{highPriority} high priority items</span>
            )}
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
