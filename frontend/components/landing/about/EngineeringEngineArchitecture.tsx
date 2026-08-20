"use client";

import { motion } from "framer-motion";
import { Cpu, Terminal, Shield, Zap, Radio, Sparkles, CheckCircle2 } from "lucide-react";

export function EngineeringEngineArchitecture() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5 text-violet-400" />
          <span>Core Infrastructure</span>
        </div>

        <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
          Built by engineers. <br />
          <span className="gradient-text">For engineers.</span>
        </h3>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
          SprintForge is designed around the realities of modern software teams — fast iteration, constant context switching, and the need to ship without bureaucratic drag.
        </p>
      </div>

      {/* Engineering Architecture Panel */}
      <div className="rounded-3xl bg-[#080c18]/90 border border-violet-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-6 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white font-display">SprintForge Engine Architecture</div>
              <div className="text-xs text-slate-400">Deterministic Real-time System · v2.4.0</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ALL MODULES OPERATIONAL</span>
          </div>
        </div>

        {/* 5 Core Engine Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Real-Time Event Engine", desc: "Socket.IO event bus with sub-15ms client state synchronization.", icon: Radio, tag: "12ms" },
            { name: "AI Velocity Copilot", desc: "Deterministic regression models for burndown & blocker forecasting.", icon: Sparkles, tag: "98% Acc" },
            { name: "Scrum & Kanban Engine", desc: "Optimistic updates with keyboard shortcuts and drag reordering.", icon: Zap, tag: "Zero Lag" },
            { name: "Granular RBAC Security", desc: "Role-based access controls with SAML 2.0 & workspace governance.", icon: Shield, tag: "SOC-2" },
            { name: "Encrypted Communication", desc: "E2E TLS 1.3 encrypted thread messaging with instant code context.", icon: Terminal, tag: "AES-256" },
            { name: "Continuous Delivery Sync", desc: "Live integration with pull requests, branch tags, and CI/CD pipelines.", icon: CheckCircle2, tag: "Automated" },
          ].map((mod, i) => {
            const Icon = mod.icon;
            return (
              <div key={i} className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-violet-500/30 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Icon className="w-4 h-4 text-violet-400" />
                    <span>{mod.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.06]">
                    {mod.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {mod.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
