"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Flame, Activity, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectHealthScoreProps {
  completionRate: number; // 0-100
  velocityData: any[];
  inProgressCount: number;
  blockedCount: number;
  totalTasks: number;
}

export function ProjectHealthScore({
  completionRate,
  velocityData,
  inProgressCount,
  blockedCount,
  totalTasks,
}: ProjectHealthScoreProps) {
  // If no tasks exist in the project
  if (totalTasks === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
              Warming Up
            </span>
            <h3 className="text-lg font-bold text-white mt-1">Project Health Score</h3>
            <p className="text-xs text-slate-400">
              Not enough data yet. Complete tasks and run sprints to generate your health metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Derive real scores based on actual metrics (0 - 100)
  // 1. Delivery score (based on completion rate)
  const deliveryScore = Math.min(100, Math.max(10, completionRate));

  // 2. Predictability (average sprint completion rate if velocity data exists)
  const predictabilityScore = velocityData.length > 0
    ? Math.round(
        velocityData.reduce((sum, v) => sum + (v.completionRate || 0), 0) / velocityData.length
      )
    : Math.min(100, Math.max(40, completionRate));

  // 3. Flow score (penalized if blocked tasks exist or WIP is too high)
  const flowPenalty = Math.min(40, blockedCount * 15);
  const flowScore = Math.max(20, 100 - flowPenalty);

  // 4. Capacity score (based on active workload balance)
  const capacityScore = inProgressCount > 0 ? Math.min(100, 60 + Math.min(40, inProgressCount * 5)) : 50;

  // Composite Health Score
  const overallScore = Math.round(
    deliveryScore * 0.35 + predictabilityScore * 0.25 + flowScore * 0.25 + capacityScore * 0.15
  );

  const status =
    overallScore >= 75
      ? { label: "ON TRACK", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", text: "Your engineering team is completing work at a steady, reliable pace." }
      : overallScore >= 50
      ? { label: "NEEDS ATTENTION", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", text: "Some tasks or blockers are slowing down delivery flow this cycle." }
      : { label: "AT RISK", color: "text-rose-400 bg-rose-500/10 border-rose-500/30", text: "High blocker count and low throughput are placing sprint milestones at risk." };

  return (
    <div className="p-6 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Overall Score Dial */}
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.01] border border-white/[0.1] shadow-inner">
            <div className="text-center">
              <span className="text-3xl font-black text-white tracking-tight">{overallScore}</span>
              <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest -mt-1">
                Score
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Project Health
              </span>
              <span className={cn("text-[10px] font-mono font-black uppercase px-2 py-0.2 rounded-full border", status.color)}>
                {status.label}
              </span>
            </div>
            <h3 className="text-base font-bold text-white leading-snug">
              Engineering Delivery Index
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-0.5 leading-relaxed">
              {status.text}
            </p>
          </div>
        </div>

        {/* Right: Dimension Progress Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 lg:max-w-xl">
          {/* Delivery */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Delivery</span>
              <span className="font-bold text-white">{deliveryScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${deliveryScore}%` }}
              />
            </div>
          </div>

          {/* Predictability */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Predictability</span>
              <span className="font-bold text-white">{predictabilityScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${predictabilityScore}%` }}
              />
            </div>
          </div>

          {/* Flow */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Flow</span>
              <span className="font-bold text-white">{flowScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${flowScore}%` }}
              />
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Capacity</span>
              <span className="font-bold text-white">{capacityScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${capacityScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
