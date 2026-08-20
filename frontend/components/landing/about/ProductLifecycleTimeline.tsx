"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Calendar,
  Code2,
  GitPullRequest,
  Rocket,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const stages = [
  {
    id: "idea",
    name: "01 · IDEA",
    title: "Backlog Grooming",
    desc: "AI estimates story points from codebase complexity.",
    icon: Lightbulb,
    badge: "Groomed",
    color: "from-purple-600 to-indigo-600",
  },
  {
    id: "plan",
    name: "02 · PLAN",
    title: "Sprint 24 Planning",
    desc: "Capacity balanced across Frontend, Backend, and DevOps.",
    icon: Calendar,
    badge: "92% Load",
    color: "from-indigo-600 to-blue-600",
  },
  {
    id: "build",
    name: "03 · BUILD",
    title: "Kanban Execution",
    desc: "Zero-latency board updates with instant keyboard agility.",
    icon: Code2,
    badge: "Active",
    color: "from-blue-600 to-cyan-600",
  },
  {
    id: "review",
    name: "04 · REVIEW",
    title: "Code Review",
    desc: "PR #42 approved with 100% automated CI coverage.",
    icon: GitPullRequest,
    badge: "Passed",
    color: "from-cyan-600 to-emerald-600",
  },
  {
    id: "ship",
    name: "05 · SHIP",
    title: "Production Release",
    desc: "v2.4.0 canary deployed with zero downtime.",
    icon: Rocket,
    badge: "Live ✓",
    color: "from-emerald-600 to-teal-600",
  },
];

export function ProductLifecycleTimeline() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % stages.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Continuous Engineering Velocity</span>
        </div>

        <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
          From Idea to Shipped Software.
        </h3>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
          A seamless, continuous lifecycle connecting backlog inception to production deployments with automated AI oversight.
        </p>
      </div>

      {/* 5-Stage Horizontal Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = activeStageIndex === idx;

          return (
            <motion.div
              key={stage.id}
              animate={{
                borderColor: isActive ? "rgba(124, 92, 255, 0.6)" : "rgba(255, 255, 255, 0.08)",
                backgroundColor: isActive ? "rgba(124, 92, 255, 0.08)" : "rgba(8, 12, 24, 0.8)",
              }}
              transition={{ duration: 0.3 }}
              className="p-5 rounded-2xl border flex flex-col justify-between min-h-[210px] relative transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-3">
                  <span>{stage.name}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${isActive ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-white/[0.04] text-slate-400"}`}>
                    {stage.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${stage.color} flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white font-display">
                    {stage.title}
                  </h4>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pl-9">
                  {stage.desc}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Stage 0{idx + 1} of 05</span>
                <span className="text-emerald-400 font-semibold">✓ Automated</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
