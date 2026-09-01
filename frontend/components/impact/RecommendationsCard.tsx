"use client";

import React from "react";
import {
  Sparkles,
  UserCheck,
  CalendarDays,
  Unlock,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Recommendation } from "./types";
import { cn } from "@/lib/utils";

interface RecommendationsCardProps {
  recommendations: Recommendation[];
  onApplyRecommendation: (rec: Recommendation) => void;
}

export function RecommendationsCard({
  recommendations,
  onApplyRecommendation,
}: RecommendationsCardProps) {
  if (recommendations.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[#070b1a] border border-white/[0.08] text-slate-400">
        <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-2 opacity-70" />
        <h4 className="text-sm font-bold text-white mb-1">Optimal Plan Efficiency</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No critical workload imbalances or urgent bottlenecks identified. Your current sprint plan is optimized.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => {
        const isReassign = rec.type === "reassign";
        const isScope = rec.type === "split_scope";
        const isUnblock = rec.type === "unblock";

        return (
          <div
            key={rec.id}
            className="p-4 rounded-2xl bg-[#070b1a] border border-white/[0.08] hover:border-violet-500/40 transition-all space-y-3 group"
          >
            {/* Header with Type Badge and Projected Gain */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "p-1.5 rounded-lg text-white",
                    isReassign
                      ? "bg-violet-600/20 text-violet-300"
                      : isScope
                      ? "bg-amber-600/20 text-amber-300"
                      : "bg-cyan-600/20 text-cyan-300"
                  )}
                >
                  {isReassign ? (
                    <UserCheck className="w-4 h-4" />
                  ) : isScope ? (
                    <CalendarDays className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </div>

                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isReassign ? "Workload Rebalancing" : isScope ? "Scope Adjustment" : "Dependency Unblock"}
                </span>
              </div>

              {/* Projected Benefit */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-mono text-[10px] font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>+{rec.projectedHealthDelta}% Health</span>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                {rec.title}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rec.description}</p>
            </div>

            {/* Mathematical Reasoning Box */}
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-slate-300">
              <span className="font-mono text-[10px] uppercase text-violet-400 font-bold block mb-0.5">
                Mathematical Justification
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">{rec.reason}</p>
            </div>

            {/* Actions */}
            <div className="pt-1 flex items-center justify-between">
              {rec.projectedDelayReductionDays > 0 && (
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  Recovers ~{rec.projectedDelayReductionDays}d schedule buffer
                </span>
              )}

              <button
                type="button"
                onClick={() => onApplyRecommendation(rec)}
                className="ml-auto px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span>Preview in Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
