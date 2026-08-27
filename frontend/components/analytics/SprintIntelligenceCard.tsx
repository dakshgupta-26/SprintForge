"use client";

import React from "react";
import { Sparkles, Zap, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SprintIntelligenceCardProps {
  projectId: string;
  avgCycleTime: number;
  inProgressCount: number;
  blockedCount: number;
  completionRate: number;
  activeSprint: any;
  velocityData: any[];
}

export function SprintIntelligenceCard({
  projectId,
  avgCycleTime,
  inProgressCount,
  blockedCount,
  completionRate,
  activeSprint,
  velocityData,
}: SprintIntelligenceCardProps) {
  const router = useRouter();

  // Dynamic Rule-Based AI Engine derived strictly from real project data:
  const insights: any[] = [];

  // 1. Delivery Flow & WIP Diagnostic
  if (inProgressCount > 6) {
    insights.push({
      type: "bottleneck",
      icon: Zap,
      title: "WIP Saturation Detected",
      severity: "warning",
      description: `Your team currently has ${inProgressCount} active items in progress/review. High concurrency frequently elevates context-switching overhead.`,
      recommendation: "Establish a strict Work-In-Progress (WIP) limit and focus on finishing open reviews before pulling new work.",
      actionText: "Inspect Board WIP",
      actionHref: `/dashboard/projects/${projectId}/board`,
      confidence: "High Confidence • Real Telemetry",
    });
  } else if (avgCycleTime > 4) {
    insights.push({
      type: "bottleneck",
      icon: Zap,
      title: "Elevated Cycle Time",
      severity: "warning",
      description: `Average cycle time is currently ${avgCycleTime} days per task. Work items may be too large or lingering in review.`,
      recommendation: "Decompose user stories into smaller units (< 5 SP) and establish a 24h peer-review SLA.",
      actionText: "View Backlog Sizing",
      actionHref: `/dashboard/projects/${projectId}/backlog`,
      confidence: "High Confidence",
    });
  }

  // 2. Sprint Risk Diagnostic
  if (activeSprint) {
    const totalPts = activeSprint.totalPoints || 0;
    const completedPts = activeSprint.completedPoints || 0;
    const remainingPts = totalPts - completedPts;

    if (remainingPts > 15 && activeSprint.status === "active") {
      insights.push({
        type: "risk",
        icon: AlertTriangle,
        title: "Sprint Scope Commitment Risk",
        severity: "critical",
        description: `${activeSprint.name} has ${remainingPts} SP remaining to be burned down.`,
        recommendation: "Review remaining scope during standup and consider deprioritizing non-critical items back to the backlog.",
        actionText: "Review Active Sprint",
        actionHref: `/dashboard/projects/${projectId}/sprints`,
        confidence: "High Confidence",
      });
    }
  }

  // 3. Positive Delivery Momentum
  if (completionRate >= 70 || (velocityData.length > 1 && velocityData[velocityData.length - 1]?.completed >= velocityData[0]?.completed)) {
    insights.push({
      type: "positive",
      icon: CheckCircle2,
      title: "Positive Throughput Velocity",
      severity: "success",
      description: `Project completion rate is at a strong ${completionRate}%. Your team is consistently delivering closed increments.`,
      recommendation: "Maintain steady sprint cadence and ensure acceptance criteria remain rigorous for all incoming tasks.",
      actionText: "View Sprint Details",
      actionHref: `/dashboard/projects/${projectId}/sprints`,
      confidence: "High Confidence",
    });
  }

  // Fallback if no specific trigger fired
  if (insights.length === 0) {
    insights.push({
      type: "neutral",
      icon: Sparkles,
      title: "Cadence Calibration in Progress",
      severity: "neutral",
      description: "SprintForge is analyzing your task lifecycle, cycle time, and pull-request intervals.",
      recommendation: "As your team continues moving tasks from Todo to Done, tailored delivery optimizations will appear here.",
      actionText: "Go to Sprint Board",
      actionHref: `/dashboard/projects/${projectId}/board`,
      confidence: "Analyzing Telemetry",
    });
  }

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c1228] to-[#090d1f] border border-violet-500/20 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              SprintForge Intelligence Engine
            </h2>
            <p className="text-[11px] font-mono text-slate-400">
              Automated delivery diagnostics and agility recommendations
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full">
          Live AI Diagnostics
        </span>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {insights.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#060914]/80 border border-white/[0.08] hover:border-violet-500/30 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-xl flex items-center justify-center text-xs",
                      item.severity === "critical"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : item.severity === "warning"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : item.severity === "success"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-violet-500/15 text-violet-400 border border-violet-500/30"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">
                    {item.confidence}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-2 border-t border-white/[0.04] space-y-2">
                <p className="text-[11px] text-violet-300/90 leading-relaxed">
                  <strong className="text-white font-mono uppercase text-[10px]">
                    Recommendation:
                  </strong>{" "}
                  {item.recommendation}
                </p>

                {item.actionText && (
                  <button
                    onClick={() => router.push(item.actionHref)}
                    className="flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-white transition-colors cursor-pointer pt-1"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
