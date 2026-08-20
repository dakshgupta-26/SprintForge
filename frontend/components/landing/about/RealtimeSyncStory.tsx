"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radio, Users, MousePointer2, GitPullRequest, CheckCircle2, Zap } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function RealtimeSyncStory() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [cursor1, setCursor1] = useState({ x: 30, y: 35 });
  const [cursor2, setCursor2] = useState({ x: 65, y: 55 });

  useEffect(() => {
    if (prefersReducedMotion) return;

    const positions1 = [
      { x: 28, y: 30 },
      { x: 45, y: 45 },
      { x: 35, y: 65 },
      { x: 25, y: 40 },
    ];

    const positions2 = [
      { x: 65, y: 50 },
      { x: 75, y: 30 },
      { x: 60, y: 70 },
      { x: 70, y: 45 },
    ];

    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % positions1.length;
      setCursor1(positions1[i]);
      setCursor2(positions2[i]);
    }, 3500);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      {/* Background glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>Multiplayer Architecture</span>
        </div>

        <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
          Everyone stays in sync.
        </h3>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
          SprintForge connects planning, development, communication, and delivery in one shared real-time workspace.
        </p>
      </div>

      {/* Real-time Multiplayer Canvas */}
      <div className="rounded-3xl bg-[#080c18]/90 border border-emerald-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-6 sm:p-8 relative min-h-[320px] overflow-hidden">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-white font-display">Live Collaborator Presence</span>
          </div>

          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Socket.IO Connected · 12ms
          </span>
        </div>

        {/* Collaborator Activity Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
          {[
            { name: "Alex Rivera", task: "Coding WebAuthn Auth", tag: "Frontend", color: "bg-violet-600" },
            { name: "Sarah Lin", task: "Reviewing PR #42", tag: "Code Review", color: "bg-amber-600" },
            { name: "Marcus Vance", task: "Deploying release/v2.4.0", tag: "Staging", color: "bg-teal-600" },
          ].map((dev, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] space-y-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-full ${dev.color} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}>
                  {dev.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{dev.name}</div>
                  <div className="text-[10px] text-slate-400">{dev.tag}</div>
                </div>
              </div>
              <div className="text-xs text-slate-300 font-medium pl-9">
                {dev.task}
              </div>
            </div>
          ))}
        </div>

        {/* Collaborative Cursors */}
        {!prefersReducedMotion && (
          <>
            <motion.div
              animate={{ left: `${cursor1.x}%`, top: `${cursor1.y}%` }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              className="absolute pointer-events-none z-20 flex items-center gap-1.5"
            >
              <MousePointer2 className="w-4 h-4 text-violet-400 fill-violet-400 drop-shadow-[0_2px_8px_rgba(124,92,255,0.8)]" />
              <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white text-[10px] font-bold shadow-md whitespace-nowrap">
                Alex (editing)
              </span>
            </motion.div>

            <motion.div
              animate={{ left: `${cursor2.x}%`, top: `${cursor2.y}%` }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
              className="absolute pointer-events-none z-20 flex items-center gap-1.5"
            >
              <MousePointer2 className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]" />
              <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold shadow-md whitespace-nowrap">
                Sarah (reviewing)
              </span>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
