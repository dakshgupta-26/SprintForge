"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Kanban,
  Clock,
  Cpu,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  GitBranch,
  Search,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  MousePointer,
  ChevronRight,
  Zap,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function HeroProductWorkspace() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeTab, setActiveTab] = useState<"board" | "timeline" | "ai" | "chat">("board");
  const [taskAnimationStep, setTaskAnimationStep] = useState<number>(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Simulated workflow: moving tasks between columns automatically
  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setTaskAnimationStep((prev) => (prev + 1) % 4);
    }, 3800);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  // Subtle 3D tilt effect on desktop
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x: x * 8, y: -y * 8 });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div className="relative max-w-6xl mx-auto px-2 sm:px-6 lg:px-8 mb-24 sm:mb-32">
      {/* Outer ambient glow */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-violet-600/25 via-indigo-600/20 to-purple-600/25 rounded-3xl blur-2xl opacity-60 pointer-events-none -z-10" />

      {/* Main Glass Workspace Shell */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 60, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          transform: isHovering && !prefersReducedMotion
            ? `perspective(1000px) rotateX(${mousePosition.y}deg) rotateY(${mousePosition.x}deg)`
            : "perspective(1000px) rotateX(0deg) rotateY(0deg)",
          transition: isHovering ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        }}
        className="rounded-2xl sm:rounded-3xl border border-white/[0.12] bg-[#080c18]/95 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden relative"
      >
        {/* Browser Chrome Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#05070f]/95 text-slate-400">
          {/* macOS window controls */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/30" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/30" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/30" />
          </div>

          {/* Browser Address Bar */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full text-xs text-slate-400 max-w-sm sm:max-w-md w-full mx-3 justify-center">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-slate-300 font-mono text-[11px] truncate">
              app.sprintforge.io/sprint-24/board
            </span>
          </div>

          {/* Real-time status */}
          <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">14ms Live Presence</span>
          </div>
        </div>

        {/* Product Workspace Inner Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
          {/* Left Navigation Sidebar */}
          <div className="hidden md:flex md:col-span-3 lg:col-span-2 flex-col justify-between p-3.5 border-r border-white/[0.06] bg-[#060913]/70">
            <div className="space-y-4">
              {/* Workspace selector */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  SF
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">Acme Core Platform</div>
                  <div className="text-[10px] text-slate-400">Sprint 24 · Active</div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-2 py-1">
                  Agile Views
                </div>
                {[
                  { id: "board", label: "Scrum Board", icon: Kanban, badge: "95%" },
                  { id: "timeline", label: "Timeline", icon: Clock },
                  { id: "ai", label: "AI Insights", icon: Cpu, badge: "AI" },
                  { id: "chat", label: "Team Chat", icon: MessageSquare, badge: "3" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? "text-violet-400" : "text-slate-500"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            item.badge === "95%"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : item.badge === "AI"
                              ? "bg-violet-500 text-white"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Health Mini Card */}
            <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/20 text-left">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-300 mb-1">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>Sprint Health: 94%</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                95% of planned scope completed. On track for Friday deployment.
              </p>
            </div>
          </div>

          {/* Main Board Workspace */}
          <div className="md:col-span-9 lg:col-span-10 p-4 sm:p-5 flex flex-col justify-between">
            {/* Top Sprint Status Bar */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
                      Sprint 24 · Core Architecture & AI Engine
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      95% COMPLETE
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> 2 days left
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-400" /> 48 / 52 Story Points
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-400" /> release/v2.4.0
                    </span>
                  </div>
                </div>

                {/* Team Avatars with active presence */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    {[
                      { name: "Sarah L.", bg: "bg-violet-600", text: "SL", online: true },
                      { name: "Alex R.", bg: "bg-indigo-600", text: "AR", online: true },
                      { name: "David C.", bg: "bg-blue-600", text: "DC", online: true },
                      { name: "Priya S.", bg: "bg-emerald-600", text: "PS", online: false },
                    ].map((user, idx) => (
                      <div
                        key={idx}
                        className="relative inline-block"
                        title={`${user.name} ${user.online ? "(Active now)" : ""}`}
                      >
                        <div
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${user.bg} text-white font-bold text-[10px] ring-2 ring-[#080c18] shadow-sm`}
                        >
                          {user.text}
                        </div>
                        {user.online && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-[#080c18]" />
                        )}
                      </div>
                    ))}
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] ring-2 ring-[#080c18]">
                      +6
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span>AI Copilot Active</span>
                  </div>
                </div>
              </div>

              {/* 4 Interactive Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Column 1: Backlog */}
                <div className="flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 min-h-[300px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span className="text-xs font-bold text-slate-200">Backlog</span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-white/[0.06] px-1.5 py-0.2 rounded">
                        1
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    <div className="p-3 rounded-xl bg-[#0c1224]/90 border border-white/[0.08] text-xs hover:border-white/[0.2] transition-colors">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono text-[10px] text-slate-400">SFG-145</span>
                        <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          3 SP
                        </span>
                      </div>
                      <h4 className="font-semibold text-white mb-2 leading-snug">
                        PostgreSQL query index optimization
                      </h4>
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] text-slate-400">
                        <span>Elena R.</span>
                        <span className="text-slate-500">Scheduled</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 min-h-[300px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-xs font-bold text-slate-200">In Progress</span>
                      <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.2 rounded">
                        {taskAnimationStep === 0 ? "2" : "1"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {/* Dynamic Moving Task SFG-124 */}
                    {taskAnimationStep === 0 && (
                      <motion.div
                        layoutId="activeTaskMotion"
                        className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/40 text-xs shadow-[0_4px_20px_rgba(124,92,255,0.2)] relative"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="font-mono text-[10px] text-violet-300 font-bold">SFG-124</span>
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            5 SP
                          </span>
                        </div>
                        <h4 className="font-semibold text-white mb-2 leading-snug">
                          Build Authentication & OAuth One-Tap
                        </h4>
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] text-slate-400">
                          <span className="text-violet-300">Alex R.</span>
                          <span className="text-emerald-400 font-mono">4/4 tests pass</span>
                        </div>
                      </motion.div>
                    )}

                    <div className="p-3 rounded-xl bg-[#0c1224]/90 border border-white/[0.08] text-xs">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono text-[10px] text-slate-400">SFG-125</span>
                        <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          5 SP
                        </span>
                      </div>
                      <h4 className="font-semibold text-white mb-2 leading-snug">
                        API Gateway token validation rate limiter
                      </h4>
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] text-slate-400">
                        <span>David C.</span>
                        <span className="text-slate-400">2/3 subtasks</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Review */}
                <div className="flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 min-h-[300px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-slate-200">Review</span>
                      <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded">
                        {taskAnimationStep === 1 || taskAnimationStep === 2 ? "2" : "1"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {/* Task in Review during step 1 and 2 */}
                    {(taskAnimationStep === 1 || taskAnimationStep === 2) && (
                      <motion.div
                        layoutId="activeTaskMotion"
                        className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs shadow-[0_4px_20px_rgba(245,158,11,0.15)] relative"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="font-mono text-[10px] text-amber-300 font-bold">SFG-124</span>
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                            PR #42 · 2 Approvals
                          </span>
                        </div>
                        <h4 className="font-semibold text-white mb-2 leading-snug">
                          Build Authentication & OAuth One-Tap
                        </h4>
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] text-slate-400">
                          <span className="text-amber-300">Alex R. → Priya S.</span>
                          <span className="text-emerald-400 font-mono">Ready to merge</span>
                        </div>
                      </motion.div>
                    )}

                    <div className="p-3 rounded-xl bg-[#0c1224]/90 border border-white/[0.08] text-xs">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono text-[10px] text-slate-400">SFG-126</span>
                        <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          3 SP
                        </span>
                      </div>
                      <h4 className="font-semibold text-white mb-2 leading-snug">
                        Fix API GraphQL batch performance
                      </h4>
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] text-slate-400">
                        <span>Sarah L.</span>
                        <span className="text-amber-300">Under Review</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 4: Done */}
                <div className="flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 min-h-[300px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-200">Done</span>
                      <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        {taskAnimationStep === 3 ? "3" : "2"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {/* Task moved to Done during step 3 */}
                    {taskAnimationStep === 3 && (
                      <motion.div
                        layoutId="activeTaskMotion"
                        className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs shadow-[0_4px_20px_rgba(34,197,94,0.15)] relative"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="font-mono text-[10px] text-emerald-300 font-bold">SFG-124</span>
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            Merged
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-200 line-through mb-2 leading-snug">
                          Build Authentication & OAuth One-Tap
                        </h4>
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] text-slate-400">
                          <span className="text-emerald-400">✓ Merged to main</span>
                          <span className="text-emerald-400 font-mono">100% test pass</span>
                        </div>
                      </motion.div>
                    )}

                    <div className="p-3 rounded-xl bg-[#0c1224]/80 border border-emerald-500/20 text-xs opacity-90">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono text-[10px] text-emerald-400">SFG-128</span>
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          8 SP
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-300 line-through mb-2 leading-snug">
                        Real-time multiplayer cursor sync
                      </h4>
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] text-slate-400">
                        <span>Marcus V.</span>
                        <span className="text-emerald-400">✓ Shipped</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Workload & Velocity Bar */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-white/[0.01] px-3.5 py-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-violet-400" />
                <span className="text-slate-300 font-medium">Sprint Velocity:</span>
                <span className="text-slate-400">
                  48 of 52 Story Points delivered · Team capacity balanced at 92%
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span className="text-emerald-400 font-semibold font-mono">95% Complete</span>
                <span className="text-slate-600">|</span>
                <span className="text-violet-400 font-medium">Target: Friday 18:00 UTC</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
