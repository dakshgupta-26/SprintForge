"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock,
  Users,
  TrendingUp,
  Activity,
  ArrowRight,
  Shield,
  Key,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const principles = [
  {
    id: "speed",
    number: "01",
    title: "Obsessive Speed",
    tagline: "Everything feels immediate.",
    description: "Sub-15ms Socket.IO synchronization, optimistic UI state updates, and instant keyboard shortcuts. No spinning loaders or waiting on page refreshes.",
    features: [
      "Sub-15ms WebSocket event broadcasts",
      "Optimistic UI state resolution",
      "Zero-latency drag-and-drop board",
    ],
    icon: Zap,
    badgeColor: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "intelligence",
    number: "02",
    title: "Autonomous Intelligence",
    tagline: "Predictive foresight without extra meetings.",
    description: "Deterministic AI models continuously correlate pull requests, commit velocities, and cycle times to prevent sprint slippage before deadlines hit.",
    features: [
      "Continuous cycle-time risk monitoring",
      "Automated capacity load rebalancing",
      "Proactive dependency blocker alerts",
    ],
    icon: Cpu,
    badgeColor: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  },
  {
    id: "governance",
    number: "03",
    title: "Enterprise Governance",
    tagline: "Rock-solid security and granular access control.",
    description: "Explicit role-based permissions, end-to-end encrypted chat channels, and verifiable audit trails designed for high-compliance engineering organizations.",
    features: [
      "Granular RBAC role matrices",
      "End-to-end encrypted communication",
      "Full audit trail & branch compliance",
    ],
    icon: ShieldCheck,
    badgeColor: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  },
];

export function ThreePrinciplesSticky() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activePrincipleId, setActivePrincipleId] = useState("speed");

  const currentPrinciple = principles.find((p) => p.id === activePrincipleId) || principles[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Section Eyebrow */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Core Engineering Principles</span>
        </div>
        <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
          Three Pillars of the <br />
          <span className="gradient-text">SprintForge Engine.</span>
        </h3>
      </div>

      {/* Principle Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2 mb-10">
        {principles.map((p) => {
          const isSelected = activePrincipleId === p.id;
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => setActivePrincipleId(p.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                isSelected
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25 border border-violet-500/50"
                  : "bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:bg-white/[0.06]"
              }`}
            >
              <span className="font-mono text-[11px] opacity-80">{p.number}</span>
              <Icon className="w-4 h-4" />
              <span>{p.title}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic 2-Column Storytelling Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Side: Principle Narrative */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPrinciple.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="text-xs font-mono font-bold text-violet-400">
                PRINCIPLE {currentPrinciple.number}
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-white font-display">
                {currentPrinciple.title}
              </h4>
              <p className="text-sm font-semibold text-violet-300">
                {currentPrinciple.tagline}
              </p>
              <p className="text-sm text-slate-400 leading-relaxed font-normal">
                {currentPrinciple.description}
              </p>

              <div className="space-y-2.5 pt-3">
                {currentPrinciple.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Interactive Live UI Visual */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-[#090d19]/95 border border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-6 sm:p-8 relative min-h-[380px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* Visual 1: Obsessive Speed */}
              {activePrincipleId === "speed" && (
                <motion.div
                  key="speed-visual"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold text-white font-display">Live Realtime Workspace</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      WebSocket: 12ms
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#060914] border border-violet-500/30 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-violet-400 font-bold">SFG-124</span>
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                        In Progress
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">Build Authentication & Passkeys</div>

                    <div className="space-y-2 pt-2 border-t border-white/[0.05] text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Alex R. → Coding WebAuthn</span>
                        <span className="text-emerald-400 font-mono">14ms optimistic sync</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Sarah L. → Staging Review</span>
                        <span className="text-slate-500 font-mono">PR #42</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Visual 2: Autonomous Intelligence */}
              {activePrincipleId === "intelligence" && (
                <motion.div
                  key="ai-visual"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-xs font-bold text-white font-display">AI Sprint Copilot · Diagnostics</span>
                    </div>
                    <span className="text-[10px] font-mono text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                      Analyzing Sprint 24
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#060914] border border-white/[0.06]">
                      <div className="text-[10px] text-slate-400 mb-1">Velocity</div>
                      <div className="font-mono font-bold text-white text-base">94% Optimal</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#060914] border border-white/[0.06]">
                      <div className="text-[10px] text-slate-400 mb-1">Capacity</div>
                      <div className="font-mono font-bold text-emerald-400 text-base">88% Balanced</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-500/30 text-xs space-y-1.5">
                    <div className="font-bold text-violet-300 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-violet-400" />
                      <span>AI Workload Recommendation</span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      Redistribute 5 story points from Backend Core → Frontend Pod. Expected completion probability increases from 94% to 97%.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Visual 3: Enterprise Governance */}
              {activePrincipleId === "governance" && (
                <motion.div
                  key="gov-visual"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-white font-display">Workspace Access & Governance</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      RBAC Active
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { role: "Owner / Admin", access: "Full Workspace Control", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
                      { role: "Project Manager", access: "Sprint & Scope Governance", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
                      { role: "Core Developer", access: "Task & Branch Execution", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#060914] border border-white/[0.06]">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.color}`}>
                          {item.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.access}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Architecture Principle {currentPrinciple.number} of 03</span>
              <span className="text-violet-400 font-semibold">Engine Core v2.4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
