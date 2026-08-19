"use client";

import { motion } from "framer-motion";
import { XCircle, CheckCircle2, ArrowRight, Zap, AlertTriangle, Sparkles, Clock, RefreshCw } from "lucide-react";

export function WorkflowComparison() {
  return (
    <section id="workflow" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient radial */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-violet-600/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <RefreshCw className="w-3 h-3" /> The Agile Evolution
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display mb-6">
            From Fragmented Chaos to <br />
            <span className="gradient-text">Predictable Velocity.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Legacy tools force developers to update status sheets and attend redundant syncs. SprintForge replaces context switching with autonomous, AI-guided execution.
          </p>
        </div>

        {/* Side by side comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Legacy / Before Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-6 sm:p-8 rounded-3xl bg-[#090d19]/60 border border-rose-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-rose-500/15 border-b border-l border-rose-500/30 text-rose-300 text-xs font-bold rounded-bl-2xl">
              WITHOUT SPRINTFORGE
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">The Fragmented Stack</h3>
                <p className="text-xs text-slate-400">Disconnected tools and reactive management</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              {[
                { title: "Scattered Conversations", desc: "Decisions lost across unorganized chat channels, tickets, and email threads." },
                { title: "Surprise Sprint Delays", desc: "Blockers discovered on the last day of the sprint during panicked retrospective calls." },
                { title: "Manual Ticket Chore", desc: "Engineers spending hours updating Jira statuses rather than writing production code." },
                { title: "Inaccurate Velocity", desc: "Guesswork story point estimation leading to burnout and missed launch deadlines." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-200 text-xs">{item.title}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* SprintForge / After Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-6 sm:p-8 rounded-3xl bg-[#0c1224]/80 border border-violet-500/40 shadow-[0_15px_40px_rgba(124,92,255,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-bl-2xl shadow-sm">
              WITH SPRINTFORGE
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300 border border-violet-500/30">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Unified Intelligent Flow</h3>
                <p className="text-xs text-violet-300/80">Real-time sync, AI foresight, and developer joy</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              {[
                { title: "Real-Time Context Sync", desc: "Encrypted Socket.IO chat embedded directly into project backlogs & tickets." },
                { title: "Predictive Risk Detection", desc: "AI models actively monitor PR velocity and surface scope creep before it halts sprints." },
                { title: "Zero-Friction Board Engine", desc: "Instant keyboard shortcuts, smooth drag-and-drop, and sub-15ms live presence." },
                { title: "Automated Burndown & Health", desc: "Live burndown metrics and smart workload rebalancing without extra status meetings." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-violet-950/30 border border-violet-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white text-xs">{item.title}</div>
                    <div className="text-slate-300 text-xs mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
