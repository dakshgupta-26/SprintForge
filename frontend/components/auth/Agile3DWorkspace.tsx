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
  Clock,
  ArrowRight,
  Activity,
  Layers,
  Shield,
  Cpu,
  Code2,
  Database,
  Rocket,
  Users,
  AlertCircle,
  TrendingUp,
  Play,
  Flame,
  GitCommit,
  Check,
  ChevronRight,
  Laptop,
  GitPullRequest,
  Server,
  Radio,
  Lightbulb,
  CloudCheck,
  CircleDot,
  Terminal,
} from "lucide-react";

interface TaskItem {
  id: string;
  key: string;
  title: string;
  column: "backlog" | "in_progress" | "review" | "done";
  priority: "urgent" | "high" | "medium";
  points: number;
  assignee: { name: string; avatar: string; role: string };
  progress?: number;
}

const KANBAN_TASKS = [
  {
    key: "SFG-120",
    title: "Define User Roles",
    column: "backlog",
    type: "Roles",
    dev: "Sarah",
  },
  {
    key: "SFG-122",
    title: "API Gateway Setup",
    column: "backlog",
    type: "Backend",
    dev: "Alex",
  },
  {
    key: "SFG-125",
    title: "UI Component Library",
    column: "in_progress",
    type: "Design",
    dev: "Sarah",
  },
  {
    key: "SFG-128",
    title: "Integration Testing",
    column: "review",
    type: "QA",
    dev: "Elena",
  },
  {
    key: "SFG-121",
    title: "Database Schema",
    column: "done",
    type: "DB",
    dev: "Marcus",
  },
  {
    key: "SFG-127",
    title: "Deploy Multi-Region API",
    column: "done",
    type: "DevOps",
    dev: "Marcus",
  },
];

export function Agile3DWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Mouse Parallax Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for high-end inertia feel
  const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Parallax Transforms for physical 3D scene depth
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-4, 4]);

  // Layer shifts for distinct depth planes
  const bgX = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);
  const bgY = useTransform(smoothY, [-0.5, 0.5], [-8, 8]);

  const midX = useTransform(smoothX, [-0.5, 0.5], [-16, 16]);
  const midY = useTransform(smoothY, [-0.5, 0.5], [-16, 16]);

  const foreX = useTransform(smoothX, [-0.5, 0.5], [-24, 24]);
  const foreY = useTransform(smoothY, [-0.5, 0.5], [-24, 24]);

  // Hover states for interactive hotspots
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Live Task Animation Cycle (SFG-124 moving smoothly across columns in a calm loop)
  const [activeTaskColumn, setActiveTaskColumn] = useState<
    "in_progress" | "review" | "done"
  >("in_progress");
  const [sprintProgress, setSprintProgress] = useState(0);

  useEffect(() => {
    // Animate sprint progress counter on mount: 0% -> 95%
    const duration = 1500;
    const startTime = performance.now();
    const target = 95;

    const animateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setSprintProgress(Math.round(ease * target));
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    requestAnimationFrame(animateCount);

    if (shouldReduceMotion) return;

    // Controlled elegant continuous delivery lifecycle loop
    const interval = setInterval(() => {
      setActiveTaskColumn((prev) => {
        if (prev === "in_progress") return "review";
        if (prev === "review") return "done";
        return "in_progress";
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

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
      className="relative w-full h-full min-h-0 flex items-center justify-center select-none"
      style={{ perspective: 1200 }}
    >
      {/* ─── Layer 0: Sophisticated Dark Atmosphere, Grid & Radial Glows ─── */}
      <motion.div
        style={{
          x: shouldReduceMotion ? 0 : bgX,
          y: shouldReduceMotion ? 0 : bgY,
        }}
        className="absolute inset-0 pointer-events-none -z-10"
      >
        {/* Core Violet & Cyan Atmospheric Light Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-gradient-to-tr from-violet-600/20 via-indigo-600/15 to-cyan-500/10 rounded-full blur-[140px] opacity-80" />
        <div className="absolute top-1/4 right-1/4 w-[380px] h-[340px] bg-purple-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />

        {/* Cyber Faint Grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.4) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
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
        initial={{ opacity: 0, scale: 0.95, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[760px] 2xl:max-w-[820px] aspect-[16/10] max-h-full flex items-center justify-center"
      >
        {/* ─── 3D Artwork Main Centerpiece Image ─── */}
        <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/[0.08] bg-[#070a14] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9),0_0_45px_rgba(139,92,246,0.18)] group">
          {/* The High-Resolution 3D Agile Scene Image */}
          <Image
            src="/agile-3d-scene.jpg"
            alt="SprintForge 3D Agile Environment"
            fill
            sizes="(max-width: 1280px) 60vw, 55vw"
            className="object-cover object-center filter brightness-[1.02] contrast-[1.05]"
            priority
          />

          {/* Atmospheric Depth Vignette & Radial Edge Lighting */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070d]/80 via-transparent to-[#05070d]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070d]/60 via-transparent to-[#05070d]/60 pointer-events-none" />
          <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent pointer-events-none" />

          {/* ───────────────────────────────────────────────────────────── */}
          {/* ─── INTERACTIVE 3D OVERLAYS LAYERED PRECISELY ON SCENE ─── */}
          {/* ───────────────────────────────────────────────────────────── */}

          {/* ─── 1. Top Bar: Live Sprint Health Status & AI Copilot ─── */}
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
                3 developers active
              </span>
            </motion.div>

            {/* Floating Holographic AI Insight Card */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-violet-950/80 via-[#0d1226]/90 to-indigo-950/80 border border-violet-500/30 backdrop-blur-xl shadow-[0_4px_20px_rgba(124,92,255,0.25)] pointer-events-auto hover:scale-[1.02] transition-transform"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse flex-shrink-0" />
              <div className="text-[10px] sm:text-[11px] text-slate-200 font-medium">
                <span className="text-violet-300 font-semibold">✦ AI Insight:</span> Velocity +14% • No blockers
              </div>
            </motion.div>
          </div>

          {/* ─── 2. Idea Lightbulb Node (Bottom-Left) ─── */}
          <div
            className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 z-20 pointer-events-auto cursor-pointer"
            onMouseEnter={() => setHoveredNode("idea")}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <div className="relative group/idea flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/50 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.35)] group-hover/idea:scale-110 transition-transform">
                <Lightbulb className="w-4 h-4 text-amber-300 fill-amber-300/30 animate-pulse" />
              </div>
              <AnimatePresence>
                {hoveredNode === "idea" && (
                  <motion.div
                    initial={{ opacity: 0, x: -6, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -6, scale: 0.95 }}
                    className="px-2.5 py-1 rounded-lg bg-[#090d1e]/90 border border-amber-400/40 text-[10px] font-semibold text-amber-200 whitespace-nowrap shadow-xl"
                  >
                    💡 Autonomous Idea Ingestion
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ─── 3. 3D Developer 1: Alex (Coding at Code Panel - Left) ─── */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : midX,
              y: shouldReduceMotion ? 0 : midY,
            }}
            className="absolute top-[48%] left-[17%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto"
          >
            {/* Developer 1 Floating Presence Badge */}
            <div
              className="group/dev1 relative flex flex-col items-center cursor-pointer"
              onMouseEnter={() => setHoveredNode("dev1")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080c1a]/90 border border-violet-400/40 shadow-[0_0_15px_rgba(139,92,246,0.35)] backdrop-blur-md hover:scale-105 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-[10px] font-bold text-violet-200 font-mono">
                  Alex
                </span>
                <span className="text-[9px] text-slate-400">• Coding</span>
              </div>

              {/* Interactive Micro Code Editor Popup */}
              <AnimatePresence>
                {(hoveredNode === "dev1" || activeTaskColumn === "in_progress") && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.92 }}
                    className="absolute bottom-8 -left-6 p-2.5 rounded-xl bg-[#090d1c]/95 border border-violet-500/40 backdrop-blur-xl shadow-2xl min-w-[190px] pointer-events-none"
                  >
                    <div className="flex items-center justify-between mb-1.5 border-b border-white/[0.08] pb-1">
                      <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-violet-400" />
                        sprint.ts
                      </span>
                      <span className="text-[8px] font-bold text-violet-300 bg-violet-500/20 px-1 rounded">
                        SFG-124
                      </span>
                    </div>
                    <pre className="text-[9px] font-mono text-slate-300 leading-relaxed">
                      <span className="text-purple-400">const</span> sprint = <span className="text-blue-400">await</span>{"\n"}
                      <span className="text-violet-300">createSprint</span>({"{\n"}
                      {"  "}velocity: <span className="text-emerald-300">42</span>,{"\n"}
                      {"  "}status: <span className="text-cyan-300">"95%"</span>{"\n"}
                      {"}"});
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ─── 4. 3D Developer 2: Sarah (Planning & Reviewing - Center) ─── */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : midX,
              y: shouldReduceMotion ? 0 : midY,
            }}
            className="absolute top-[44%] left-[64%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto"
          >
            <div
              className="group/dev2 relative flex flex-col items-center cursor-pointer"
              onMouseEnter={() => setHoveredNode("dev2")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080c1a]/90 border border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.35)] backdrop-blur-md hover:scale-105 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-200 font-mono">
                  Sarah
                </span>
                <span className="text-[9px] text-slate-400">• Reviewing</span>
              </div>

              {/* Developer 2 Micro Status */}
              <AnimatePresence>
                {hoveredNode === "dev2" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.92 }}
                    className="absolute bottom-8 -right-6 p-2 rounded-xl bg-[#090d1c]/95 border border-amber-500/40 backdrop-blur-xl shadow-2xl min-w-[170px] pointer-events-none"
                  >
                    <div className="flex items-center gap-1 text-[9px] text-amber-300 font-medium">
                      <GitPullRequest className="w-3 h-3" />
                      <span>PR #104 Review Complete</span>
                    </div>
                    <span className="text-[8px] text-slate-400 mt-0.5 block">
                      Approved for production merge
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ─── 5. 3D Developer 3: Marcus (Deploying - Right near Rocket) ─── */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : foreX,
              y: shouldReduceMotion ? 0 : foreY,
            }}
            className="absolute top-[35%] right-[16%] translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto"
          >
            <div
              className="group/dev3 relative flex flex-col items-center cursor-pointer"
              onMouseEnter={() => setHoveredNode("dev3")}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080c1a]/90 border border-emerald-400/40 shadow-[0_0_15px_rgba(34,197,94,0.35)] backdrop-blur-md hover:scale-105 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-200 font-mono">
                  Marcus
                </span>
                <span className="text-[9px] text-slate-400">• Deploying</span>
              </div>
            </div>
          </motion.div>

          {/* ─── 6. Database Stack Node (Right Side) ─── */}
          <div className="absolute bottom-[22%] right-[12%] z-20 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#080c1a]/85 border border-cyan-400/30 backdrop-blur-md shadow-md text-[9px] text-cyan-300 font-mono">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>Synced (12ms)</span>
            </div>
          </div>

          {/* ─── 7. Production Release Rocket Node (Far Right) ─── */}
          <div className="absolute bottom-[10%] right-[4%] z-20 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080c1a]/85 border border-emerald-400/30 backdrop-blur-md shadow-md text-[9px] text-emerald-300 font-mono">
              <Rocket className="w-3 h-3 text-violet-400" />
              <span>v2.4.1 Production ● Live</span>
            </div>
          </div>

          {/* ─── 8. HERO SPRINT CORE 24 (CENTERPIECE — 95% COMPLETE) ─── */}
          <motion.div
            style={{
              x: shouldReduceMotion ? 0 : midX,
              y: shouldReduceMotion ? 0 : midY,
            }}
            className="absolute bottom-[8%] left-[58%] -translate-x-1/2 z-30 pointer-events-auto"
          >
            {/* Holographic Glowing 95% Sprint Progress Platform Container */}
            <div className="relative group/sprint flex flex-col items-center">
              {/* Outer Neon Glow Halo */}
              <div className="absolute inset-0 bg-violet-600/30 rounded-3xl blur-xl group-hover/sprint:bg-violet-600/50 transition-all -z-10" />

              {/* 95% Sprint Core Card */}
              <div className="p-3 sm:p-4 rounded-2xl bg-[#090d1c]/90 border border-violet-400/40 backdrop-blur-2xl shadow-[0_0_35px_rgba(139,92,246,0.4)] flex items-center gap-4 hover:border-violet-400/70 transition-all">
                {/* SVG 95% Circular Progress Ring */}
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    {/* Background Ring Track */}
                    <circle
                      cx="28"
                      cy="28"
                      r="23"
                      className="stroke-slate-800/80"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    {/* Glowing 95% Progress Ring */}
                    <circle
                      cx="28"
                      cy="28"
                      r="23"
                      className="stroke-violet-500 transition-all duration-1000 ease-out"
                      strokeWidth="5"
                      strokeDasharray={144.5}
                      strokeDashoffset={144.5 * (1 - sprintProgress / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  {/* Central Progress Percentage */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-white font-mono leading-none">
                      {sprintProgress}%
                    </span>
                    <span className="text-[7px] font-bold text-violet-300 uppercase tracking-tighter">
                      Done
                    </span>
                  </div>
                </div>

                {/* Sprint 24 Identity & Metrics */}
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white font-display tracking-tight flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-violet-400 fill-violet-400/20" />
                      Sprint 24
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      95% COMPLETE
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-300 font-medium">
                    <span>2 Days Left</span>
                    <span className="text-slate-600">•</span>
                    <span>32 Tasks (30 Done)</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── 9. Glowing Workflow Laser Circuit Path Over Scene ─── */}
          <div className="absolute inset-0 pointer-events-none z-15">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 820 512" fill="none">
              {/* Circuit Path Connecting: Lightbulb (70, 460) -> Code (180, 260) -> Sprint Core (470, 360) -> Database (680, 400) -> Rocket (750, 280) */}
              <path
                d="M 80 460 C 120 440, 140 320, 180 270 C 220 220, 380 320, 480 360 C 560 390, 640 420, 690 400 C 730 380, 740 320, 760 280"
                stroke="rgba(139, 92, 246, 0.25)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 80 460 C 120 440, 140 320, 180 270 C 220 220, 380 320, 480 360 C 560 390, 640 420, 690 400 C 730 380, 740 320, 760 280"
                stroke="url(#workflow-glow-laser)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Traveling Glowing Laser Particle */}
              <motion.circle
                r="5"
                fill="#c084fc"
                filter="url(#laser-glow-blur)"
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        cx: [80, 180, 480, 690, 760],
                        cy: [460, 270, 360, 400, 280],
                      }
                }
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <defs>
                <linearGradient id="workflow-glow-laser" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="25%" stopColor="#8b5cf6" />
                  <stop offset="65%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
                <filter id="laser-glow-blur" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>
          </div>

          {/* ─── 10. Live Kanban Task Card Cycle SFG-124 (In Progress -> Review -> Done) ─── */}
          <div className="absolute top-[28%] left-[48%] -translate-x-1/2 z-25 pointer-events-auto">
            <AnimatePresence mode="wait">
              {activeTaskColumn === "in_progress" && (
                <motion.div
                  key="sfg-124-active-progress"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="p-2.5 rounded-xl bg-[#090d1c]/90 border border-violet-500/50 backdrop-blur-xl shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:-translate-y-1 transition-transform"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[10px] font-bold text-violet-400 font-mono">
                      SFG-124
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300">
                      In Progress (95%)
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white">
                    Build Authentication
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>Alex Chen</span>
                    <span className="text-violet-300 font-mono font-bold">8 pts</span>
                  </div>
                </motion.div>
              )}

              {activeTaskColumn === "review" && (
                <motion.div
                  key="sfg-124-active-review"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="p-2.5 rounded-xl bg-[#090d1c]/90 border border-amber-500/50 backdrop-blur-xl shadow-[0_0_25px_rgba(251,191,36,0.3)] hover:-translate-y-1 transition-transform"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[10px] font-bold text-amber-400 font-mono">
                      SFG-124
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      Reviewing
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white">
                    Build Authentication
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                    <span className="text-amber-300 flex items-center gap-1">
                      <GitPullRequest className="w-3 h-3" /> PR #104 Approved
                    </span>
                    <span className="text-amber-300 font-mono font-bold">8 pts</span>
                  </div>
                </motion.div>
              )}

              {activeTaskColumn === "done" && (
                <motion.div
                  key="sfg-124-active-done"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="p-2.5 rounded-xl bg-[#090d1c]/90 border border-emerald-500/50 backdrop-blur-xl shadow-[0_0_25px_rgba(34,197,94,0.3)] hover:-translate-y-1 transition-transform"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">
                      SFG-124
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-xs font-semibold text-white">
                    Build Authentication
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                    <span className="text-emerald-400 font-medium">✓ Deployed to Prod</span>
                    <span className="text-emerald-400 font-mono font-bold">8 pts</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
