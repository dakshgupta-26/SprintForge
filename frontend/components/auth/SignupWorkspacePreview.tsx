"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  GitPullRequest,
  Check,
  Shield,
} from "lucide-react";

export function SignupWorkspacePreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Mouse Parallax Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [2.5, -2.5]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-3, 3]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full min-h-0 flex flex-col justify-center select-none"
      style={{ perspective: 1200 }}
    >
      {/* ─── Layer 0: Ambient Radial Glows & Grid ─── */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[480px] bg-gradient-to-tr from-violet-600/15 via-indigo-600/10 to-cyan-500/10 rounded-full blur-[130px]" />
        <div className="absolute top-1/4 right-10 w-[300px] h-[260px] bg-purple-600/10 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.4) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ─── Layer 1: 3D Perspective Workspace Board ─── */}
      <motion.div
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[740px] rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#070a14]/90 backdrop-blur-xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(124,92,255,0.12)] p-4 sm:p-5 xl:p-6 overflow-hidden relative"
      >
        {/* Subtle Top Card Border Highlight */}
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

        {/* ─── Board Header Bar ─── */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06]">
          {/* Active Sprint Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold font-mono text-white">Sprint 24</span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                • 2 Days Left
              </span>
            </div>

            {/* 95% Pill */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>95% Complete</span>
            </div>
          </div>

          {/* AI Insight Pill */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-violet-950/70 via-[#0d1226]/80 to-indigo-950/70 border border-violet-500/30 text-[10px] sm:text-[11px] font-medium text-slate-200">
            <Sparkles className="w-3 h-3 text-violet-400 animate-pulse flex-shrink-0" />
            <span>
              <strong className="text-violet-300">AI:</strong> Velocity +14% • On Track
            </span>
          </div>
        </div>

        {/* ─── Kanban Columns Grid ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Column 1: Backlog */}
          <div className="flex flex-col gap-2 rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Backlog
              </span>
              <span className="text-[9px] font-mono bg-white/[0.06] px-1.5 py-0.2 rounded text-slate-400">
                2
              </span>
            </div>

            {/* Card 1 */}
            <div className="p-2 sm:p-2.5 rounded-lg bg-[#0a0e1e]/90 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                <span>SFG-140</span>
                <span className="text-slate-500">3 pts</span>
              </div>
              <p className="text-[11px] font-medium text-slate-200 leading-tight">
                Role-Based Access
              </p>
              <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
                <span className="px-1.5 py-0.2 rounded bg-white/[0.05] text-[8px] font-semibold text-slate-400">
                  Security
                </span>
                <span className="w-4 h-4 rounded-full bg-violet-600/30 text-violet-300 font-bold flex items-center justify-center text-[8px]">
                  S
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-2 sm:p-2.5 rounded-lg bg-[#0a0e1e]/90 border border-white/[0.06] hover:border-white/[0.12] transition-colors hidden sm:block">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                <span>SFG-141</span>
                <span className="text-slate-500">2 pts</span>
              </div>
              <p className="text-[11px] font-medium text-slate-200 leading-tight">
                Rate Limiting
              </p>
            </div>
          </div>

          {/* Column 2: In Progress (Active Pulse) */}
          <div className="flex flex-col gap-2 rounded-xl bg-violet-500/[0.03] border border-violet-500/20 p-2.5 relative">
            <div className="flex items-center justify-between text-[10px] font-semibold text-violet-300 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                In Progress
              </span>
              <span className="text-[9px] font-mono bg-violet-500/20 px-1.5 py-0.2 rounded text-violet-300">
                1
              </span>
            </div>

            {/* Hero Active Task Card */}
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="p-2.5 rounded-lg bg-[#0c1126] border border-violet-500/40 shadow-[0_0_18px_rgba(124,92,255,0.2)]"
            >
              <div className="flex items-center justify-between text-[9px] font-mono text-violet-400 mb-1">
                <span className="font-bold">SFG-143</span>
                <span className="text-violet-300 font-bold">8 pts</span>
              </div>
              <p className="text-[11px] font-semibold text-white leading-tight">
                Build Authentication
              </p>
              <div className="mt-2 flex items-center justify-between text-[9px]">
                <span className="flex items-center gap-1 text-[8px] font-medium text-emerald-400">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  Alex coding
                </span>
                <span className="w-4 h-4 rounded-full bg-indigo-600/40 border border-indigo-400/40 text-indigo-200 font-bold flex items-center justify-center text-[8px]">
                  A
                </span>
              </div>
            </motion.div>
          </div>

          {/* Column 3: Review */}
          <div className="flex flex-col gap-2 rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-amber-300 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Review
              </span>
              <span className="text-[9px] font-mono bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-300">
                1
              </span>
            </div>

            {/* Card 1 */}
            <div className="p-2 sm:p-2.5 rounded-lg bg-[#0a0e1e]/90 border border-amber-500/25 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-[9px] font-mono text-amber-400 mb-1">
                <span>SFG-144</span>
                <span className="text-amber-300 font-bold">5 pts</span>
              </div>
              <p className="text-[11px] font-medium text-slate-200 leading-tight">
                Realtime Sync
              </p>
              <div className="mt-2 flex items-center justify-between text-[9px]">
                <span className="flex items-center gap-1 text-[8px] text-amber-300 font-medium">
                  <GitPullRequest className="w-2.5 h-2.5" />
                  PR #108 Approved
                </span>
                <span className="w-4 h-4 rounded-full bg-amber-600/30 text-amber-200 font-bold flex items-center justify-center text-[8px]">
                  S
                </span>
              </div>
            </div>
          </div>

          {/* Column 4: Done */}
          <div className="flex flex-col gap-2 rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-300 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Done
              </span>
              <span className="text-[9px] font-mono bg-emerald-500/20 px-1.5 py-0.2 rounded text-emerald-300">
                30
              </span>
            </div>

            {/* Card 1 */}
            <div className="p-2 sm:p-2.5 rounded-lg bg-[#0a0e1e]/90 border border-emerald-500/25">
              <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400 mb-1">
                <span>SFG-145</span>
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] font-medium text-slate-200 leading-tight">
                Multi-Region Deploy
              </p>
              <div className="mt-2 flex items-center justify-between text-[9px]">
                <span className="text-[8px] text-emerald-400 font-medium">
                  ✓ Prod Live
                </span>
                <span className="w-4 h-4 rounded-full bg-emerald-600/30 text-emerald-200 font-bold flex items-center justify-center text-[8px]">
                  M
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Footer Live Dev Activity Strip ─── */}
        <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Alex: Coding
            </span>
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Sarah: Reviewing
            </span>
            <span className="flex items-center gap-1 text-slate-300 font-medium hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Marcus: Deploying
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500">
            <span>Synced 12ms</span>
          </div>
        </div>
      </motion.div>

      {/* ─── 3 Compact Capability Signals ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 max-w-[740px]"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <span className="text-[11px] font-medium leading-tight">AI-powered sprint insights</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300">
          <Zap className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span className="text-[11px] font-medium leading-tight">Real-time team collaboration</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300">
          <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] font-medium leading-tight">Agile workflows for engineers</span>
        </div>
      </motion.div>
    </div>
  );
}
