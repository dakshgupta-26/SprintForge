"use client";

import React from "react";
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface SprintForgeAIBriefProps {
  stats: {
    dueToday: number;
    inProgress: number;
    inReview: number;
    overdue: number;
    completed: number;
  };
  activeSprint?: any;
  onOpenWork: () => void;
}

export function SprintForgeAIBrief({
  stats,
  activeSprint,
  onOpenWork,
}: SprintForgeAIBriefProps) {
  let briefTitle = "Workspace Health Overview";
  let briefText =
    "All engineering work streams are operating normally. No critical blockers are currently impeding project delivery.";
  let badgeText = "All Clear";
  let BadgeIcon = ShieldCheck;
  let badgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

  if (stats.overdue > 0) {
    briefTitle = "Schedule Risk Detected";
    briefText = `You have ${stats.overdue} overdue task${stats.overdue === 1 ? "" : "s"}. Resolving these items before taking on new work is recommended to keep the sprint cycle time stable.`;
    badgeText = "Action Needed";
    BadgeIcon = AlertTriangle;
    badgeColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
  } else if (stats.dueToday > 0) {
    briefTitle = "Daily Sprint Delivery Focus";
    briefText = `You have ${stats.dueToday} task${stats.dueToday === 1 ? "" : "s"} due today. Focusing on closing these items will advance the active sprint completion rate.`;
    badgeText = "Today's Focus";
    BadgeIcon = Sparkles;
    badgeColor = "text-violet-400 bg-violet-500/10 border-violet-500/20";
  } else if (activeSprint) {
    briefTitle = "Sprint Trajectory";
    briefText = `Active sprint "${activeSprint.name}" is underway. Keep in-progress work lean to avoid review bottlenecks.`;
    badgeText = "Sprint Active";
    BadgeIcon = Sparkles;
    badgeColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
  }

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0d1430] via-[#090d1f] to-[#070b1a] border border-violet-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="w-9 h-9 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-violet-300">
              SprintForge Intelligence
            </span>
            <span
              className={`text-[9px] font-mono font-bold uppercase px-2 py-0.2 rounded-full border flex items-center gap-1 ${badgeColor}`}
            >
              <BadgeIcon className="w-2.5 h-2.5" />
              <span>{badgeText}</span>
            </span>
          </div>

          <h4 className="text-sm font-bold text-white tracking-tight">{briefTitle}</h4>
          <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-3xl">
            {briefText}
          </p>
        </div>
      </div>

      <button
        onClick={onOpenWork}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 hover:text-white text-xs font-bold transition-all self-start sm:self-auto flex-shrink-0 cursor-pointer"
      >
        <span>View My Work</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
