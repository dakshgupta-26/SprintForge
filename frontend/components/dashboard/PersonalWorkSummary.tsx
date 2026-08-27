"use client";

import React from "react";
import { Clock, Zap, CheckCircle2, AlertTriangle, Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonalWorkSummaryProps {
  userName?: string;
  activeFilter: string;
  onFilterSelect: (filter: string) => void;
  stats: {
    dueToday: number;
    inProgress: number;
    inReview: number;
    overdue: number;
    completed: number;
    blocked: number;
  };
}

export function PersonalWorkSummary({
  userName = "Developer",
  activeFilter,
  onFilterSelect,
  stats,
}: PersonalWorkSummaryProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Dynamic context message based on real data
  let contextMessage = "Your workspace is calm. Here is a snapshot of your engineering priorities.";
  if (stats.overdue > 0) {
    contextMessage = `You have ${stats.overdue} overdue task${stats.overdue === 1 ? "" : "s"} requiring attention.`;
  } else if (stats.dueToday > 0) {
    contextMessage = `You have ${stats.dueToday} task${stats.dueToday === 1 ? "" : "s"} scheduled for completion today.`;
  } else if (stats.inProgress > 0) {
    contextMessage = `You have ${stats.inProgress} task${stats.inProgress === 1 ? "" : "s"} actively in progress.`;
  }

  const todayDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const METRIC_BLOCKS = [
    {
      id: "today",
      label: "Due Today",
      value: stats.dueToday,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      id: "in_progress",
      label: "In Progress",
      value: stats.inProgress,
      icon: Zap,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      id: "review",
      label: "In Review",
      value: stats.inReview,
      icon: Eye,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      id: "overdue",
      label: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: stats.overdue > 0 ? "text-rose-400" : "text-slate-400",
      bg: stats.overdue > 0 ? "bg-rose-500/10" : "bg-white/[0.04]",
      border: stats.overdue > 0 ? "border-rose-500/20" : "border-white/[0.06]",
    },
    {
      id: "completed",
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Contextual Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{greeting}, {userName.split(" ")[0]}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{contextMessage}</p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-[#090d1f] border border-white/[0.06] px-3 py-1.5 rounded-xl self-start md:self-auto">
          Today • {todayDateStr}
        </div>
      </div>

      {/* Compact Interactive Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {METRIC_BLOCKS.map((item) => {
          const Icon = item.icon;
          const isSelected = activeFilter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onFilterSelect(item.id)}
              className={cn(
                "p-3.5 rounded-2xl bg-[#090d1f] border transition-all text-left flex items-center justify-between gap-3 cursor-pointer group",
                isSelected
                  ? "border-violet-500/60 bg-violet-600/10 shadow-[0_0_15px_rgba(124,92,255,0.2)]"
                  : "border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.02]"
              )}
            >
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                  {item.label}
                </span>
                <span className="text-xl font-black text-white group-hover:text-violet-200 transition-colors">
                  {item.value}
                </span>
              </div>

              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center border",
                  item.bg,
                  item.border,
                  item.color
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
