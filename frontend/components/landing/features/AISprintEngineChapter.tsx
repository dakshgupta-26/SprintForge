"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Zap,
  TrendingUp,
  ShieldCheck,
  Check,
  ArrowRight,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function AISprintEngineChapter() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [healthScore, setHealthScore] = useState(0);
  const [blockerResolved, setBlockerResolved] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  // Animated health counter 0 -> 94
  useEffect(() => {
    if (!isInView || prefersReducedMotion) {
      setHealthScore(94);
      return;
    }

    let start = 0;
    const end = 94;
    const duration = 1200;
    const stepTime = duration / end;

    const timer = setInterval(() => {
      start += 1;
      setHealthScore(start);
      if (start >= end) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, prefersReducedMotion]);

  const handleResolveBlocker = () => {
    setIsResolving(true);
    setTimeout(() => {
      setIsResolving(false);
      setBlockerResolved(true);
    }, 500);
  };

  return (
    <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      {/* Radiant ambient backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[450px] bg-gradient-to-r from-violet-600/20 via-purple-600/15 to-indigo-600/20 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Climax Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_25px_rgba(124,92,255,0.2)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Autonomous Agile Engine</span>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] font-display mb-6"
        >
          Your sprint, <br />
          <span className="gradient-text">with intelligence built in.</span>
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-400 leading-relaxed"
        >
          SprintForge continuously analyzes velocity, workload, blockers, and task cycle time to help your team stay ahead of deadlines without extra meetings.
        </motion.p>
      </div>

      {/* Main AI Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left AI Diagnostics Shell (7 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#0c1226] to-[#070b16] border border-violet-500/40 shadow-[0_20px_60px_rgba(124,92,255,0.2)] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between"
        >
          {/* Subtle traveling light sparkle animation */}
          {!prefersReducedMotion && (
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-violet-500/10 to-transparent rotate-45 pointer-events-none animate-[shimmer_8s_infinite]" />
          )}

          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shadow-sm">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-display">Sprint Health & Velocity Forecaster</div>
                  <div className="text-xs text-slate-400">Sprint-Optimizer-XL · Realtime Engine</div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                98.4% Confidence
              </span>
            </div>

            {/* Metric Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Health Score */}
              <div className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Sprint Health Index</span>
                  <span className="text-emerald-400 font-mono font-bold">OPTIMAL</span>
                </div>
                <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
                  <span>{healthScore}%</span>
                  <span className="text-xs text-emerald-400 font-bold">+6% vs avg</span>
                </div>
                <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isInView ? "94%" : "0%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 rounded-full"
                  />
                </div>
              </div>

              {/* Completion Probability */}
              <div className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Completion Probability</span>
                  <span className="text-violet-300 font-mono font-bold">ON TARGET</span>
                </div>
                <div className="text-3xl font-black text-violet-300 font-mono flex items-baseline gap-1">
                  <span>96.8%</span>
                  <span className="text-xs text-slate-400">by Friday 18:00</span>
                </div>
                <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isInView ? "96.8%" : "0%" }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* AI Insight Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-violet-950/40 border border-violet-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>✦ AI Proactive Insight</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Velocity is <strong className="text-emerald-400">18% higher</strong> than historical average. You have spare capacity in the Frontend pod to pull <span className="font-mono text-violet-300 font-bold">SFG-142</span> into the current sprint without risk.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Burndown regression detection active</span>
            </span>
            <span className="text-violet-400 font-mono text-[11px]">Sub-40ms latency</span>
          </div>
        </motion.div>

        {/* Right AI Blocker Detection & Auto-Resolution (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="lg:col-span-5 rounded-3xl bg-[#090d19]/95 border border-white/[0.08] hover:border-violet-500/30 transition-all p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${blockerResolved ? "text-emerald-400" : "text-amber-400"}`} />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Blocker Intelligence
                </span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                  blockerResolved
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}
              >
                {blockerResolved ? "RESOLVED" : "ACTIVE SIGNAL"}
              </span>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {!blockerResolved ? (
                  <motion.div
                    key="active-blocker"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-2xl bg-[#060914] border border-amber-500/30 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-amber-400 font-bold">SFG-142</span>
                      <span className="text-[10px] text-slate-400">Impact: Medium</span>
                    </div>
                    <div className="text-xs font-semibold text-white">
                      Waiting for API Dependency (Auth Token Migration)
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      <strong className="text-slate-300">Suggested action:</strong> Fast-track PR #128 review to unblock passkey integration.
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="resolved-blocker"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✓ Blocker Resolved Automatically</span>
                    </div>
                    <div className="text-xs text-slate-200">
                      PR #128 expedited and merged. Downstream dependency for SFG-142 unblocked with 0 sprint delay.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-6">
            {!blockerResolved ? (
              <button
                onClick={handleResolveBlocker}
                disabled={isResolving}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white btn-primary-glow transition-all"
              >
                {isResolving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing AI Mitigation...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white" />
                    <span>Auto-Mitigate Blocker with AI →</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setBlockerResolved(false)}
                className="w-full py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs text-slate-400 hover:text-white transition-colors"
              >
                Reset Diagnostic Demo
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
