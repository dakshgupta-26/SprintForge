"use client";

import React from "react";
import {
  TrendingDown,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { SimulationResult } from "./types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";

interface SimulationComparisonCardProps {
  result: SimulationResult;
}

export function SimulationComparisonCard({ result }: SimulationComparisonCardProps) {
  const {
    scenarioTaskTitle,
    baselineHealth,
    simulatedHealth,
    healthDelta,
    projectedDelayDeltaDays,
    affectedTasks,
    affectedEngineers,
    newBlockersCreated,
  } = result;

  const isHealthImproved = healthDelta > 0;
  const isDelayIncreased = projectedDelayDeltaDays > 0;

  return (
    <div className="space-y-4">
      {/* ── Impact Highlights Banner ── */}
      <div
        className={cn(
          "p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
          isHealthImproved
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : healthDelta === 0
            ? "bg-white/[0.03] border-white/[0.08] text-slate-300"
            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        )}
      >
        <div className="flex items-center gap-2.5">
          {isHealthImproved ? (
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-rose-400" />
          )}
          <div>
            <h4 className="font-bold text-sm text-white">
              Simulation Result for "{scenarioTaskTitle}"
            </h4>
            <p className="text-xs text-slate-400">
              {isHealthImproved
                ? `Plan efficiency improves by +${healthDelta}%`
                : healthDelta < 0
                ? `Plan efficiency degrades by ${healthDelta}% with ${projectedDelayDeltaDays}d projected delay`
                : "No significant change to overall sprint metrics"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center font-mono text-xs font-bold">
          <span
            className={cn(
              "px-2.5 py-1 rounded-xl border",
              isHealthImproved
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : healthDelta < 0
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-white/[0.06] text-slate-300 border-white/[0.1]"
            )}
          >
            {healthDelta >= 0 ? `+${healthDelta}%` : `${healthDelta}%`} Health
          </span>

          <span
            className={cn(
              "px-2.5 py-1 rounded-xl border",
              projectedDelayDeltaDays > 0
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            )}
          >
            {projectedDelayDeltaDays > 0 ? `+${projectedDelayDeltaDays}d` : `${projectedDelayDeltaDays}d`} Delay
          </span>
        </div>
      </div>

      {/* ── Side-by-Side Comparison Plan Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Plan */}
        <div className="p-4 rounded-2xl bg-[#070b1a] border border-white/[0.08] space-y-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
            CURRENT BASELINE PLAN
          </span>

          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className="text-slate-400">Sprint Health</span>
              <span className="text-white font-bold">{baselineHealth.healthScore}%</span>
            </div>
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${baselineHealth.healthScore}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block font-mono">Completion</span>
              <span className="text-xs font-bold text-white font-mono">
                {new Date(baselineHealth.projectedCompletionDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block font-mono">Critical Tasks</span>
              <span className="text-xs font-bold text-rose-400 font-mono">
                {baselineHealth.criticalTasksCount}
              </span>
            </div>
          </div>
        </div>

        {/* Simulated Plan */}
        <div className="p-4 rounded-2xl bg-[#090e24] border border-violet-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-violet-300">
              SIMULATED SCENARIO
            </span>
            <span className="px-1.5 py-0.2 rounded bg-violet-600/30 text-violet-300 text-[9px] font-mono font-bold">
              PREVIEW
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className="text-slate-400">Projected Health</span>
              <span className="text-white font-bold">{simulatedHealth.healthScore}%</span>
            </div>
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  simulatedHealth.healthScore >= 75
                    ? "bg-emerald-500"
                    : simulatedHealth.healthScore >= 50
                    ? "bg-amber-500"
                    : "bg-rose-500"
                )}
                style={{ width: `${simulatedHealth.healthScore}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-mono">New Completion</span>
              <span className="text-xs font-bold text-white font-mono">
                {new Date(simulatedHealth.projectedCompletionDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-mono">Critical Tasks</span>
              <span className="text-xs font-bold text-rose-400 font-mono">
                {simulatedHealth.criticalTasksCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Affected Downstream Tasks Breakdown ── */}
      <div className="p-4 rounded-2xl bg-[#070b1a] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Downstream Impact Propagation ({affectedTasks.length} tasks • {affectedEngineers.length} engineers)
          </span>
        </div>

        {affectedTasks.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No downstream tasks affected by this change.</p>
        ) : (
          <div className="divide-y divide-white/[0.06] max-h-48 overflow-y-auto pr-1">
            {affectedTasks.map((t) => (
              <div key={t._id} className="py-2 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{t.title}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {t.assignees[0]?.name || "Unassigned"}
                  </p>
                </div>
                {t.delayImpactDays > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/25">
                    +{t.delayImpactDays}d delay
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
