"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Clock,
  User,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { EnrichedTask } from "./types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";

interface CriticalPathTimelineProps {
  criticalPathIds: string[];
  tasks: EnrichedTask[];
  onSelectTask: (taskId: string) => void;
  onSimulateTask: (taskId: string) => void;
}

export function CriticalPathTimeline({
  criticalPathIds,
  tasks,
  onSelectTask,
  onSimulateTask,
}: CriticalPathTimelineProps) {
  const taskMap = React.useMemo(() => {
    const map = new Map<string, EnrichedTask>();
    tasks.forEach((t) => map.set(t._id, t));
    return map;
  }, [tasks]);

  const criticalTasks = criticalPathIds
    .map((id) => taskMap.get(id))
    .filter(Boolean) as EnrichedTask[];

  if (criticalTasks.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[#070b1a] border border-white/[0.08] text-slate-400">
        <Zap className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
        <h4 className="text-sm font-bold text-white mb-1">No Critical Path Bottlenecks</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          All active tasks currently have healthy schedule float buffers and are not blocking the sprint release.
        </p>
      </div>
    );
  }

  const totalDuration = criticalTasks.reduce(
    (sum, t) => sum + (t.cpm?.durationDays || t.estimatedHours / 6),
    0
  );

  return (
    <div className="space-y-4">
      {/* ── Explainability Header Banner ── */}
      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-xs">
        <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-rose-200">
            Critical Dependency Chain ({criticalTasks.length} tasks • {totalDuration.toFixed(1)} days total)
          </span>
          <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
            These tasks have <strong className="text-rose-300">zero schedule float</strong>. A 1-day delay on any task below will directly postpone the overall sprint release by 1 full day.
          </p>
        </div>
      </div>

      {/* ── Sequential Timeline Cards ── */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-rose-500 before:via-violet-500 before:to-indigo-500">
        {criticalTasks.map((task, idx) => {
          const duration = task.cpm?.durationDays || Math.round((task.estimatedHours / 6) * 10) / 10;
          const startDay = task.cpm?.earliestStart || 0;
          const finishDay = task.cpm?.earliestFinish || duration;

          return (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative p-4 rounded-2xl bg-[#070b1a] border border-white/[0.08] hover:border-rose-500/40 transition-all group"
            >
              {/* Step indicator dot */}
              <div className="absolute -left-6 top-5 -translate-x-1/2 w-4 h-4 rounded-full bg-[#05070d] border-2 border-rose-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-rose-400 uppercase">
                      Step #{idx + 1}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300 font-mono text-[10px]">
                      Day {startDay.toFixed(1)} → Day {finishDay.toFixed(1)}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      ({duration}d effort)
                    </span>
                  </div>

                  <h4
                    onClick={() => onSelectTask(task._id)}
                    className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors cursor-pointer truncate"
                  >
                    {task.title}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      {task.assignees[0] ? (
                        <UserAvatar
                          src={task.assignees[0].avatar}
                          name={task.assignees[0].name}
                          size="xs"
                          className="w-4 h-4 text-[9px]"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span className="text-[11px] font-medium text-slate-300">
                        {task.assignees[0]?.name || "Unassigned"}
                      </span>
                    </div>

                    <span>•</span>

                    <span className="text-[11px] font-mono text-cyan-400">
                      {task.blastRadius.downstreamCount} downstream tasks
                    </span>
                  </div>
                </div>

                {/* Simulate Button */}
                <button
                  type="button"
                  onClick={() => onSimulateTask(task._id)}
                  className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-violet-600 hover:text-white border border-white/[0.08] hover:border-violet-500 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-400 group-hover:text-white" />
                  <span>Simulate Delay</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
