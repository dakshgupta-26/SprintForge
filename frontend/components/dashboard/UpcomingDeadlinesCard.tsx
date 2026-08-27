"use client";

import React from "react";
import { Clock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface UpcomingDeadlinesCardProps {
  tasks: any[];
  onTaskSelect: (task: any) => void;
}

export function UpcomingDeadlinesCard({ tasks = [], onTaskSelect }: UpcomingDeadlinesCardProps) {
  const now = Date.now();
  const upcomingTasks = tasks
    .filter((t) => t.dueDate && t.status !== "done")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-xl space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">Upcoming Deadlines</h3>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">Next deliverables</p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-full">
          {upcomingTasks.length} pending
        </span>
      </div>

      {upcomingTasks.length === 0 ? (
        <div className="p-4 rounded-2xl bg-[#060914] border border-dashed border-white/[0.06] text-center space-y-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto opacity-70" />
          <p className="text-xs text-slate-400">No approaching deadlines.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingTasks.map((task) => {
            const taskKey = `SFG-${task._id?.slice(-4).toUpperCase()}`;
            const dueTime = new Date(task.dueDate).getTime();
            const daysDiff = Math.ceil((dueTime - now) / 86400000);
            const isOverdue = daysDiff < 0;

            return (
              <div
                key={task._id}
                onClick={() => onTaskSelect(task)}
                className="p-2.5 rounded-2xl bg-[#060914] border border-white/[0.04] hover:border-violet-500/40 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-violet-300">
                      {taskKey}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] font-mono text-slate-500 truncate">
                      {task.project?.name || "SprintForge"}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white truncate group-hover:text-violet-200">
                    {task.title}
                  </h5>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded-full border",
                      isOverdue
                        ? "text-rose-400 bg-rose-500/10 border-rose-500/20 font-bold"
                        : daysDiff === 0
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20 font-bold"
                        : "text-slate-400 bg-white/[0.02] border-white/[0.06]"
                    )}
                  >
                    {isOverdue
                      ? `${Math.abs(daysDiff)}d overdue`
                      : daysDiff === 0
                      ? "Today"
                      : daysDiff === 1
                      ? "Tomorrow"
                      : `in ${daysDiff}d`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
