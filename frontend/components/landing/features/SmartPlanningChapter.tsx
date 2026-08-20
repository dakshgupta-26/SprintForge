"use client";

import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Clock,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const pods = [
  {
    name: "Frontend Pod",
    lead: "Alex Rivera",
    pointsAllocated: 18,
    pointsMax: 20,
    pct: 90,
    gradient: "from-violet-500 to-indigo-500",
    colorBadge: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    tasksCount: 6,
    health: "Optimal load",
  },
  {
    name: "Backend Core",
    lead: "David Chen",
    pointsAllocated: 20,
    pointsMax: 22,
    pct: 91,
    gradient: "from-indigo-500 to-blue-500",
    colorBadge: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    tasksCount: 7,
    health: "Balanced",
  },
  {
    name: "DevOps & Infra",
    lead: "Sarah Lin",
    pointsAllocated: 10,
    pointsMax: 12,
    pct: 83,
    gradient: "from-cyan-500 to-teal-500",
    colorBadge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    tasksCount: 3,
    health: "Capacity buffer",
  },
];

export function SmartPlanningChapter() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [counter, setCounter] = useState(0);
  const [selectedPod, setSelectedPod] = useState<number | null>(null);

  // Animated counter from 0 to 48
  useEffect(() => {
    if (!isInView || prefersReducedMotion) {
      setCounter(48);
      return;
    }

    let start = 0;
    const end = 48;
    const duration = 1200;
    const stepTime = duration / end;

    const timer = setInterval(() => {
      start += 1;
      setCounter(start);
      if (start >= end) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, prefersReducedMotion]);

  return (
    <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Side: Chapter Story Copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-violet-400" /> Chapter 01 · Planning
          </div>

          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight font-display">
            Smart Sprint Planning & Capacity Balancing
          </h3>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            Automate sprint backlog creation, story point distribution, and member capacity forecasting using historical velocity models. Eliminate sprint overcommitments forever.
          </p>

          {/* Capability points */}
          <div className="space-y-3 pt-2">
            {[
              {
                title: "Historical Velocity Calibration",
                desc: "Analyzes preceding sprints to recommend realistic scope ceilings.",
              },
              {
                title: "Multi-Track Load Balancing",
                desc: "Prevents frontend or backend bottlenecks before sprint kick-off.",
              },
              {
                title: "Automated Buffer Allocation",
                desc: "Reserves 10% contingency points for unexpected production bugs.",
              },
            ].map((cap, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-200">{cap.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{cap.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Interactive Capacity Balancing Visualization */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#090d1a]/90 border border-violet-500/30 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white font-display">Sprint 24 · Workload Distribution</div>
                <div className="text-xs text-slate-400">3 Engineering Pods · 16 Total Tasks</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-[#0d1428] border border-white/[0.08] text-right">
                <div className="text-[10px] text-slate-400">Total Allocated</div>
                <div className="text-xs font-mono font-bold text-emerald-400">
                  {counter} / 52 SP ({Math.round((counter / 52) * 100)}%)
                </div>
              </div>
            </div>
          </div>

          {/* Pod Capacity Distribution Bars */}
          <div className="space-y-4 my-6">
            {pods.map((pod, i) => {
              const isSelected = selectedPod === i;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedPod(isSelected ? null : i)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-violet-950/30 border-violet-500/50 shadow-md"
                      : "bg-[#060914] border-white/[0.06] hover:border-white/[0.15]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{pod.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${pod.colorBadge}`}>
                        {pod.lead}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {isInView ? pod.pointsAllocated : 0} / {pod.pointsMax} SP
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">
                        {pod.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: isInView ? `${pod.pct}%` : "0%" }}
                      transition={{ duration: 0.9, delay: prefersReducedMotion ? 0 : 0.2 + i * 0.15, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${pod.gradient} rounded-full`}
                    />
                  </div>

                  {/* Expanded detail when clicked */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-300"
                    >
                      <span>{pod.tasksCount} sprint tickets assigned</span>
                      <span className="text-emerald-400 font-semibold">✓ {pod.health}</span>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Recommendation Box */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 15 }}
            transition={{ duration: 0.6, delay: prefersReducedMotion ? 0 : 0.7 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/50 to-indigo-950/50 border border-violet-500/30 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-violet-300 flex items-center gap-2">
                <span>✦ AI Recommendation</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                  98% Confidence
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                Workload is evenly balanced across all 3 engineering tracks. Frontend pod has capacity buffer to pull in SFG-142 without risking Friday release.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
