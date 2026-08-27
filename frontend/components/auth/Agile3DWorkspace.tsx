"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  GitPullRequest,
  Check,
  Shield,
  Layers,
  TrendingUp,
  Terminal,
  Activity,
  Rocket,
  Users,
  Clock,
  Brain,
  Code2,
} from "lucide-react";

interface Agile3DWorkspaceProps {
  variant?: "login" | "signup";
}

export function Agile3DWorkspace({ variant = "login" }: Agile3DWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Mouse Parallax Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for inertia feel
  const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Parallax Transforms for depth planes
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [2.5, -2.5]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-3.5, 3.5]);

  const bgX = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);
  const bgY = useTransform(smoothY, [-0.5, 0.5], [-6, 6]);

  const midX = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);
  const midY = useTransform(smoothY, [-0.5, 0.5], [-12, 12]);

  const foreX = useTransform(smoothX, [-0.5, 0.5], [-18, 18]);
  const foreY = useTransform(smoothY, [-0.5, 0.5], [-18, 18]);

  // Hover states for interactive nodes
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [sprintProgress, setSprintProgress] = useState(0);

  useEffect(() => {
    // Animate sprint progress counter on mount: 0% -> 95%
    const duration = 1400;
    const startTime = performance.now();
    const target = 95;

    const animateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setSprintProgress(Math.round(ease * target));
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    requestAnimationFrame(animateCount);
  }, []);

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
    setHoveredNode(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full min-h-0 flex flex-col justify-center select-none"
      style={{ perspective: 1200 }}
    >
      {/* ─── Layer 0: Atmospheric Lighting & Grid ─── */}
      <motion.div
        style={{
          x: shouldReduceMotion ? 0 : bgX,
          y: shouldReduceMotion ? 0 : bgY,
        }}
        className="absolute inset-0 pointer-events-none -z-10"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[520px] bg-gradient-to-tr from-violet-600/20 via-indigo-600/15 to-cyan-500/15 rounded-full blur-[140px] opacity-90" />
        <div className="absolute top-1/4 right-1/4 w-[380px] h-[320px] bg-purple-600/15 rounded-full blur-[110px]" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.4) 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
          }}
        />
      </motion.div>

      {/* ─── Layer 1: 3D Stage Container (Perspective Tilt) ─── */}
      <motion.div
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[780px] 2xl:max-w-[840px] aspect-[16/9] max-h-full flex items-center justify-center"
      >
        {/* ─── Main Cinematic Workspace Window ─── */}
        <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/[0.1] bg-[#070a14] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9),0_0_45px_rgba(139,92,246,0.2)] group">
          {/* High-Resolution Cinematic 3D Agile Engineering Workspace Image */}
          <Image
            src="/agile-cinematic-workspace.jpg"
            alt="SprintForge Agile Engineering Workspace"
            fill
            sizes="(max-width: 1280px) 60vw, 55vw"
            className="object-cover object-center filter brightness-[1.02] contrast-[1.04]"
            priority
          />

          {/* Vignette & Rim Lighting */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070d]/70 via-transparent to-[#05070d]/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070d]/40 via-transparent to-[#05070d]/40 pointer-events-none" />
          <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent pointer-events-none" />

          {/* ───────────────────────────────────────────────────────────── */}
          {/* ─── INTERACTIVE HOLOGRAPHIC OVERLAYS LAYERED ON SCENE ─── */}
          {/* ───────────────────────────────────────────────────────────── */}

          {/* ─── 1. Top Bar: Live Sprint Status ─── */}
          <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-5 flex items-center justify-between z-20 pointer-events-none">
            {/* Live Workspace Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#080c1a]/85 border border-white/[0.12] backdrop-blur-xl shadow-lg pointer-events-auto cursor-pointer hover:border-violet-500/40 transition-all"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 tracking-wide font-mono">
                LIVE SPRINT
              </span>
              <span className="text-[10px] text-slate-500">•</span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-300">
                4 engineers active
              </span>
            </motion.div>

            {/* Quick Sync Pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#090d1e]/85 border border-cyan-400/30 backdrop-blur-md shadow-md text-[10px] text-cyan-300 font-mono"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Realtime Sync (8ms)</span>
            </motion.div>
          </div>

          {/* ─── 2. Interactive Hotspot: Engineer 1 (Alex - Coding at Desk) ─── */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : midX,
              y: shouldReduceMotion ? 0 : midY,
            }}
            className="absolute bottom-[30%] left-[24%] -translate-x-1/2 z-30 pointer-events-auto"
          >
            <div
              className="group/alex relative flex flex-col items-center cursor-pointer"
              onMouseEnter={() => setHoveredNode("alex")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080c1a]/90 border border-violet-400/40 shadow-[0_0_15px_rgba(139,92,246,0.35)] backdrop-blur-md hover:scale-105 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-[10px] font-bold text-violet-200 font-mono">
                  Alex
                </span>
                <span className="text-[9px] text-slate-400">• Coding</span>
              </div>

              {/* Popup Code Snippet */}
              <AnimatePresence>
                {hoveredNode === "alex" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.92 }}
                    className="absolute bottom-8 -left-4 p-2.5 rounded-xl bg-[#090d1c]/95 border border-violet-500/40 backdrop-blur-xl shadow-2xl min-w-[190px] pointer-events-none z-40"
                  >
                    <div className="flex items-center justify-between mb-1.5 border-b border-white/[0.08] pb-1">
                      <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-violet-400" />
                        auth.service.ts
                      </span>
                      <span className="text-[8px] font-bold text-violet-300 bg-violet-500/20 px-1 rounded">
                        SFG-143
                      </span>
                    </div>
                    <pre className="text-[9px] font-mono text-slate-300 leading-relaxed">
                      <span className="text-purple-400">const</span> session = <span className="text-blue-400">await</span>{"\n"}
                      <span className="text-violet-300">verifyWorkspace</span>(token);
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ─── 3. Interactive Hotspot: Engineer 2 (Zaid - Planning at Agile Board) ─── */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : foreX,
              y: shouldReduceMotion ? 0 : foreY,
            }}
            className="absolute top-[32%] left-[43%] -translate-x-1/2 z-30 pointer-events-auto"
          >
            <div
              className="group/lead relative flex flex-col items-center cursor-pointer"
              onMouseEnter={() => setHoveredNode("lead")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080c1a]/90 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.35)] backdrop-blur-md hover:scale-105 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-200 font-mono">
                  Zaid
                </span>
                <span className="text-[9px] text-slate-400">• Lead</span>
              </div>

              {/* Popup Board Insight */}
              <AnimatePresence>
                {hoveredNode === "lead" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.92 }}
                    className="absolute bottom-8 -left-8 p-2 rounded-xl bg-[#090d1c]/95 border border-cyan-500/40 backdrop-blur-xl shadow-2xl min-w-[170px] pointer-events-none z-40"
                  >
                    <div className="text-[9px] text-cyan-300 font-medium flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>Sprint 24 Planning</span>
                    </div>
                    <span className="text-[8px] text-slate-400 mt-0.5 block">
                      32 Tasks allocated • 0 Blockers
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ─── 4. Interactive Hotspot: Engineer 3 (Sarah - Reviewing PRs) ─── */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : midX,
              y: shouldReduceMotion ? 0 : midY,
            }}
            className="absolute top-[34%] right-[32%] translate-x-1/2 z-30 pointer-events-auto"
          >
            <div
              className="group/sarah relative flex flex-col items-center cursor-pointer"
              onMouseEnter={() => setHoveredNode("sarah")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080c1a]/90 border border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.35)] backdrop-blur-md hover:scale-105 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-200 font-mono">
                  Sarah
                </span>
                <span className="text-[9px] text-slate-400">• Reviewing</span>
              </div>

              {/* Popup PR Status */}
              <AnimatePresence>
                {hoveredNode === "sarah" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.92 }}
                    className="absolute bottom-8 -right-4 p-2 rounded-xl bg-[#090d1c]/95 border border-amber-500/40 backdrop-blur-xl shadow-2xl min-w-[170px] pointer-events-none z-40"
                  >
                    <div className="flex items-center gap-1 text-[9px] text-amber-300 font-medium">
                      <GitPullRequest className="w-3 h-3" />
                      <span>PR #108 Approved</span>
                    </div>
                    <span className="text-[8px] text-slate-400 mt-0.5 block">
                      Ready for multi-region deploy
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ─── 5. Hero Holographic Badge: SPRINT 24 | 95% COMPLETE (Center) ─── */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : midX,
              y: shouldReduceMotion ? 0 : midY,
            }}
            className="absolute bottom-[28%] left-[53%] -translate-x-1/2 z-30 pointer-events-auto"
          >
            <div className="relative group/sprint flex flex-col items-center">
              {/* Outer Halo */}
              <div className="absolute inset-0 bg-violet-600/30 rounded-2xl blur-lg group-hover/sprint:bg-violet-600/50 transition-all -z-10" />

              {/* Holographic Pill */}
              <div className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#080d22]/90 border border-violet-400/40 backdrop-blur-xl shadow-[0_0_30px_rgba(124,92,255,0.4)] flex items-center gap-2 sm:gap-2.5 hover:border-violet-400/70 transition-all">
                <span className="text-xs sm:text-sm font-black text-white font-mono tracking-tight flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-violet-400 fill-violet-400/20" />
                  SPRINT 24
                </span>
                <span className="text-slate-500 text-xs">|</span>
                <span className="text-[11px] sm:text-xs font-bold text-emerald-400 font-mono tracking-wide">
                  {sprintProgress}% COMPLETE
                </span>
              </div>
            </div>
          </motion.div>

          {/* ─── 6. Holographic AI Sprint Insight Card (Right Side) ─── */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : foreX,
              y: shouldReduceMotion ? 0 : foreY,
            }}
            className="absolute top-[26%] right-[8%] z-30 pointer-events-auto hidden sm:block"
          >
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-950/80 via-[#0a0f26]/90 to-indigo-950/80 border border-violet-400/40 backdrop-blur-xl shadow-[0_8px_30px_rgba(124,92,255,0.3)] hover:scale-[1.02] transition-transform min-w-[190px]">
              <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-white/[0.08] pb-1">
                <span className="text-[9px] font-bold text-violet-300 uppercase tracking-wider font-mono flex items-center gap-1">
                  <Brain className="w-3 h-3 text-violet-400" />
                  AI SPRINT INSIGHT
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-white tracking-tight">
                Velocity is trending <span className="text-emerald-400 font-mono">+14%</span>
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-300 font-medium">
                <span className="text-emerald-400 font-semibold">● ON TRACK</span>
                <span className="text-slate-400 font-mono">0 Blockers</span>
              </div>
            </div>
          </motion.div>

          {/* ─── 7. Production Release Rocket Node (Bottom Right) ─── */}
          <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080c1a]/90 border border-emerald-400/30 backdrop-blur-md shadow-md text-[9px] text-emerald-300 font-mono">
              <Rocket className="w-3 h-3 text-violet-400" />
              <span>v2.4.1 Production ● Live</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── 3 Product Capability Signals Underneath ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 sm:mt-3.5 max-w-[780px] 2xl:max-w-[840px]"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <span className="text-[11px] font-medium leading-tight">AI-powered sprint insights</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300">
          <Zap className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span className="text-[11px] font-medium leading-tight">Real-time team collaboration</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300">
          <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] font-medium leading-tight">Agile workflows for engineers</span>
        </div>
      </motion.div>
    </div>
  );
}
