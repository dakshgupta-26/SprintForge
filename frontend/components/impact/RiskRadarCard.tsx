"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  User,
  GitBranch,
} from "lucide-react";
import { EnrichedTask } from "./types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";

interface RiskRadarCardProps {
  topRisks: Array<{
    taskId: string;
    title: string;
    risk: any;
    downstreamCount: number;
  }>;
  tasks: EnrichedTask[];
  onSelectTask: (taskId: string) => void;
  onSimulateTask: (taskId: string) => void;
}

export function RiskRadarCard({
  topRisks,
  tasks,
  onSelectTask,
  onSimulateTask,
}: RiskRadarCardProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(
    topRisks.length > 0 ? topRisks[0].taskId : null
  );

  const taskMap = React.useMemo(() => {
    const map = new Map<string, EnrichedTask>();
    tasks.forEach((t) => map.set(t._id, t));
    return map;
  }, [tasks]);

  if (topRisks.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[#070b1a] border border-white/[0.08] text-slate-400">
        <ShieldAlert className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
        <h4 className="text-sm font-bold text-white mb-1">Risk Radar Clear</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No elevated risk tasks detected in this sprint scope.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topRisks.map((item, index) => {
        const isExpanded = expandedTaskId === item.taskId;
        const fullTask = taskMap.get(item.taskId);
        const score = item.risk.score || 0;
        const level = item.risk.level || "moderate";

        return (
          <div
            key={item.taskId}
            className={cn(
              "rounded-2xl border transition-all duration-200 overflow-hidden",
              isExpanded
                ? "bg-[#070b1a] border-violet-500/40 shadow-xl"
                : "bg-[#070b1a]/60 border-white/[0.08] hover:border-white/[0.15]"
            )}
          >
            {/* ── Summary Header Row ── */}
            <div
              onClick={() => setExpandedTaskId(isExpanded ? null : item.taskId)}
              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Rank Badge */}
                <span
                  className={cn(
                    "w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center flex-shrink-0",
                    index === 0
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : index === 1
                      ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                      : "bg-white/[0.06] text-slate-400"
                  )}
                >
                  #{index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {item.title}
                    </h4>
                    {item.risk.isCriticalPath && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px] font-bold border border-rose-500/30">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {item.downstreamCount} downstream task{item.downstreamCount === 1 ? "" : "s"} •{" "}
                    {fullTask?.assignees[0]?.name || "Unassigned"}
                  </p>
                </div>
              </div>

              {/* Score Pill & Chevron */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={cn(
                    "px-2 py-0.5 rounded-lg text-xs font-mono font-bold border",
                    level === "critical"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : level === "high"
                      ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  )}
                >
                  Risk: {score}
                </div>

                <button
                  type="button"
                  className="p-1 text-slate-500 hover:text-white"
                  aria-label="Toggle details"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* ── Expanded Mathematical Explainability Breakdown ── */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3.5 pb-3.5 pt-1 border-t border-white/[0.06] space-y-3"
                >
                  {/* Reasons List */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                      Why is this task scored {score}/100?
                    </span>
                    <div className="space-y-1">
                      {(item.risk.reasons || []).map((reason: string, rIdx: number) => (
                        <div
                          key={rIdx}
                          className="flex items-start gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-slate-300"
                        >
                          <span className="text-violet-400 font-bold mt-0.5">•</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Factor Contribution Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {(item.risk.factors || []).map((f: any, fIdx: number) => (
                      <div
                        key={fIdx}
                        className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">{f.name}</span>
                          <span className="text-violet-300 font-bold">
                            +{f.score}/{f.maxScore} pts
                          </span>
                        </div>
                        <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${(f.score / f.maxScore) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Strip */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectTask(item.taskId)}
                      className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>Highlight in Dependency Graph</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSimulateTask(item.taskId)}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-violet-600/30"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Simulate Change</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
