"use client";

import React from "react";
import Link from "next/link";
import { Zap, Calendar, Target, ArrowRight, Layers, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ActiveSprintWidgetProps {
  sprint: any | null;
  projectId?: string;
  projectName?: string;
}

export function ActiveSprintWidget({
  sprint,
  projectId,
  projectName = "TASKDEV",
}: ActiveSprintWidgetProps) {
  if (!sprint) {
    return (
      <div className="p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
          <Zap className="w-3.5 h-3.5 text-violet-400" />
          <span>Active Sprint</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#060914] border border-dashed border-white/[0.06] text-center space-y-2">
          <p className="text-xs text-slate-400">
            No active sprint is currently running for {projectName}.
          </p>
          {projectId && (
            <Link
              href={`/dashboard/projects/${projectId}/sprints`}
              className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold"
            >
              <span>Manage Sprints</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  const totalTasks = sprint.tasks?.length || 0;
  const completedTasks =
    sprint.tasks?.filter((t: any) => t.status === "done").length || 0;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c1228] to-[#090d1f] border border-violet-500/25 shadow-xl space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-violet-400">
              Active Sprint
            </span>
            <h3 className="text-sm font-bold text-white leading-none">{sprint.name}</h3>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
          {daysLeft}d left
        </span>
      </div>

      {/* Date & Goal */}
      <div className="space-y-1 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>
            {formatDate(sprint.startDate, "short")} — {formatDate(sprint.endDate, "short")}
          </span>
        </div>

        {sprint.goal && (
          <div className="flex items-start gap-1.5 pt-1 text-slate-300 font-sans text-[11px] leading-snug">
            <Target className="w-3 h-3 text-violet-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">Goal: {sprint.goal}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>
            Progress:{" "}
            <strong className="text-white">
              {completedTasks}/{totalTasks}
            </strong>
          </span>
          <span className="font-bold text-violet-300">{completionPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Direct Board Link */}
      {projectId && (
        <div className="pt-2 border-t border-white/[0.04] flex justify-end">
          <Link
            href={`/dashboard/projects/${projectId}/board`}
            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold transition-colors"
          >
            <span>Open Sprint Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
