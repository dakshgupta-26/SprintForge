"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  Sparkles,
  GitBranch,
  CheckCircle2,
  Rocket,
  ShieldCheck,
  ArrowRight,
  Cpu,
  Clock,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const pipelineNodes = [
  {
    id: "sprint",
    stage: "01 · Sprint Planning",
    title: "Sprint 24",
    subtitle: "48 / 52 SP · 95% Complete",
    icon: Clock,
    badge: "Active",
    color: "from-violet-600 to-indigo-600",
    badgeColor: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  {
    id: "task",
    stage: "02 · Task Execution",
    title: "SFG-124: Build Auth",
    subtitle: "WebAuthn Passkey Provider",
    icon: GitBranch,
    badge: "In Progress",
    color: "from-indigo-600 to-blue-600",
    badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  {
    id: "review",
    stage: "03 · Peer Review",
    title: "PR #42 Approved",
    subtitle: "2 Senior Sign-offs · 100% CI",
    icon: CheckCircle2,
    badge: "Approved",
    color: "from-blue-600 to-cyan-600",
    badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  {
    id: "deploy",
    stage: "04 · Continuous Ship",
    title: "Production Release",
    subtitle: "v2.4.0 Deployed to Global CDN",
    icon: Rocket,
    badge: "Deployed ✓",
    color: "from-emerald-600 to-teal-600",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
];

export function WhyWeBuiltIt() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeSignalIndex, setActiveSignalIndex] = useState(0);

  // Periodic signal flow along the pipeline
  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setActiveSignalIndex((prev) => (prev + 1) % pipelineNodes.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      {/* Statement Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Why We Built SprintForge</span>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-display leading-tight"
        >
          Project management shouldn&apos;t <br />
          <span className="gradient-text">slow engineers down.</span>
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal"
        >
          SprintForge is designed around the way modern engineering teams actually build software — continuously, collaboratively, and with real-time context at every step.
        </motion.p>
      </div>

      {/* Connected Lifecycle Node System Visual */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
        className="rounded-3xl bg-[#090d19]/90 border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-6 sm:p-10 relative overflow-hidden"
      >
        {/* Top Browser/Terminal bar */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/[0.06] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="font-bold text-white font-display">SprintForge Continuous Delivery Pipeline</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Realtime Stream Active
          </span>
        </div>

        {/* 4 Connected Nodes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
          {pipelineNodes.map((node, index) => {
            const Icon = node.icon;
            const isSignalActive = activeSignalIndex === index;

            return (
              <div key={node.id} className="relative">
                {/* Node Card */}
                <motion.div
                  animate={{
                    borderColor: isSignalActive ? "rgba(124, 92, 255, 0.6)" : "rgba(255, 255, 255, 0.08)",
                    backgroundColor: isSignalActive ? "rgba(124, 92, 255, 0.08)" : "rgba(6, 9, 20, 0.9)",
                  }}
                  transition={{ duration: 0.4 }}
                  className="p-5 rounded-2xl border flex flex-col justify-between min-h-[190px] shadow-sm relative z-10 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-3">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        {node.stage}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${node.badgeColor}`}>
                        {node.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white font-display leading-snug">
                        {node.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-400 pl-10 leading-relaxed">
                      {node.subtitle}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Latency: 14ms</span>
                    <span className="text-emerald-400">✓ Verified</span>
                  </div>
                </motion.div>

                {/* Connecting Arrow for Desktop */}
                {index < pipelineNodes.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20 items-center justify-center">
                    <ArrowRight className={`w-4 h-4 transition-colors duration-300 ${isSignalActive ? "text-violet-400 translate-x-0.5" : "text-slate-600"}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
