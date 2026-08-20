"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Radio,
  GitPullRequest,
  CheckCircle2,
  Rocket,
  ArrowRight,
  MousePointer2,
  Sparkles,
  Zap,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface CollabEvent {
  id: string;
  initials: string;
  name: string;
  color: string;
  action: string;
  target: string;
  time: string;
  type: "move" | "pr" | "deploy";
}

const feedEvents: CollabEvent[] = [
  {
    id: "e1",
    initials: "AR",
    name: "Alex Rivera",
    color: "bg-violet-600",
    action: "moved",
    target: "SFG-139 to Code Review",
    time: "Just now",
    type: "move",
  },
  {
    id: "e2",
    initials: "PS",
    name: "Priya Sharma",
    color: "bg-amber-600",
    action: "approved",
    target: "Pull Request #42 (Auth migration)",
    time: "1m ago",
    type: "pr",
  },
  {
    id: "e3",
    initials: "MV",
    name: "Marcus Vance",
    color: "bg-teal-600",
    action: "started deployment",
    target: "release/v2.4.0 to Staging",
    time: "2m ago",
    type: "deploy",
  },
  {
    id: "e4",
    initials: "SL",
    name: "Sarah Lin",
    color: "bg-rose-600",
    action: "merged",
    target: "PR #128 · 100% CI pass",
    time: "4m ago",
    type: "pr",
  },
];

export function RealtimeCollaborationChapter() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [cursorPos, setCursorPos] = useState({ x: 40, y: 35 });
  const [activeCursorUser, setActiveCursorUser] = useState("Alex R. (editing SFG-139)");

  // Simulated collaborator cursor movement
  useEffect(() => {
    if (prefersReducedMotion) return;

    const positions = [
      { x: 35, y: 30, text: "Alex R. (editing SFG-139)" },
      { x: 65, y: 45, text: "Priya S. (reviewing PR #42)" },
      { x: 50, y: 70, text: "Marcus V. (deploying canary)" },
      { x: 25, y: 55, text: "Sarah L. (commenting)" },
    ];

    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % positions.length;
      setCursorPos({ x: positions[i].x, y: positions[i].y });
      setActiveCursorUser(positions[i].text);
    }, 3200);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-[110px] pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Story Copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-emerald-400" /> Chapter 03 · Presence
          </div>

          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight font-display">
            Everyone stays in sync.
          </h3>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            See who&apos;s working, what changed, and what&apos;s moving forward in real time. Sub-15ms Socket.IO multi-cursor presence eliminates status checks and merge collision anxiety.
          </p>

          {/* Presence Badges */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-white">4 Developers Active in Workspace</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                12ms latency
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[
                { name: "Alex R.", status: "Online", color: "bg-violet-600" },
                { name: "Priya S.", status: "Online", color: "bg-amber-600" },
                { name: "Marcus V.", status: "Online", color: "bg-teal-600" },
                { name: "Sarah L.", status: "Online", color: "bg-rose-600" },
              ].map((user, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] text-[11px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Live Simulation Canvas */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 rounded-3xl bg-[#090d1a]/90 border border-emerald-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-display">Live Team Activity Stream</div>
                <div className="text-[10px] text-slate-400 font-mono">Channel: #sprint-24-core · Socket.IO</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Broadcast</span>
            </div>
          </div>

          {/* Live Activity Stream Feed */}
          <div className="space-y-3 relative min-h-[220px]">
            {feedEvents.map((evt, idx) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-white/[0.15] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full ${evt.color} flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0`}>
                    {evt.initials}
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-white">{evt.name}</span>{" "}
                    <span className="text-slate-400">{evt.action}</span>{" "}
                    <span className="font-semibold text-violet-300">{evt.target}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">{evt.time}</span>
              </motion.div>
            ))}

            {/* Simulated Live Cursor Indicator */}
            {!prefersReducedMotion && (
              <motion.div
                animate={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute pointer-events-none z-20 flex items-center gap-1.5"
              >
                <MousePointer2 className="w-4 h-4 text-violet-400 fill-violet-400 drop-shadow-[0_2px_8px_rgba(124,92,255,0.8)]" />
                <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white text-[10px] font-bold shadow-md whitespace-nowrap">
                  {activeCursorUser}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
