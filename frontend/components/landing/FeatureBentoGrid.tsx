"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Users,
  MessageSquare,
  ShieldCheck,
  Zap,
  Cpu,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Lock,
  Radio,
  Sliders,
  Send,
} from "lucide-react";

export function FeatureBentoGrid() {
  const [activeKanbanStep, setActiveKanbanStep] = useState(1);
  const [liveTyping, setLiveTyping] = useState("Alex Rivera is updating SFG-138...");

  return (
    <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Zap className="w-3 h-3" /> Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display mb-6">
            Everything your team needs <br />
            <span className="gradient-text">to ship better software.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Engineered from the ground up for modern engineering culture: fast, intelligent, transparent, and effortlessly collaborative.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Smart Sprint Planning (Span 2 columns on lg) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#0a0f1d]/80 border border-white/[0.08] hover:border-violet-500/30 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[90px] pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold w-fit mb-4">
                <Clock className="w-3.5 h-3.5" /> Intelligent Scheduling
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">
                Smart Sprint Planning & Capacity Balancing
              </h3>
              <p className="text-sm text-slate-400 max-w-xl mb-6 leading-relaxed">
                Automate sprint creation, story point distribution, and member capacity forecasting with historical velocity models.
              </p>
            </div>

            {/* Visual Sprint Planning Element */}
            <div className="p-4 rounded-2xl bg-[#070a14] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-400" /> Sprint 24 Velocity Distribution
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">48 / 52 Capacity (92%)</span>
              </div>

              {/* Progress bars by member */}
              <div className="space-y-2 pt-1">
                {[
                  { name: "Frontend Pod", load: "18 SP", pct: 90, color: "from-violet-500 to-indigo-500" },
                  { name: "Backend Core", load: "20 SP", pct: 85, color: "from-indigo-500 to-blue-500" },
                  { name: "DevOps & Cloud", load: "10 SP", pct: 65, color: "from-cyan-500 to-teal-500" },
                ].map((pod, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between text-slate-400 mb-1 text-[11px]">
                      <span>{pod.name}</span>
                      <span className="font-mono text-slate-300">{pod.load}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${pod.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pod.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Auto-allocation badge */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-violet-950/40 border border-violet-500/20 text-[11px] text-violet-300">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span>AI Recommendation: Workload evenly balanced across all 3 engineering tracks.</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Kanban & Scrum (1 column on lg) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1d]/80 border border-white/[0.08] hover:border-violet-500/30 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold w-fit mb-4">
                <FolderKanban className="w-3.5 h-3.5" /> Agile Workflows
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">
                Kanban & Scrum Boards
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Zero-lag drag and drop with keyboard-first navigation and custom status stages.
              </p>
            </div>

            {/* Interactive Mini Column Switcher */}
            <div className="p-4 rounded-2xl bg-[#070a14] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Interactive Ticket State</span>
                <span className="font-mono text-violet-400">SFG-124</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0d1324] border border-white/[0.08] text-xs">
                <div className="font-semibold text-white mb-1">Migrate OAuth to Google One-Tap</div>
                <div className="flex items-center gap-1.5 mt-2">
                  {["To Do", "In Progress", "Done"].map((step, idx) => (
                    <button
                      key={step}
                      onClick={() => setActiveKanbanStep(idx)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        activeKanbanStep === idx
                          ? "bg-violet-600 text-white shadow-sm"
                          : "bg-white/[0.04] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {step}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Instant sub-10ms state updates</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Real-Time Presence & Collaboration (1 column) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1d]/80 border border-white/[0.08] hover:border-violet-500/30 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold w-fit mb-4">
                <Radio className="w-3.5 h-3.5" /> Sub-15ms Presence
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">
                Real-Time Collaboration
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Multiplayer presence, live task viewing indicators, and conflict-free concurrent editing.
              </p>
            </div>

            {/* Presence Activity Feed */}
            <div className="p-3.5 rounded-2xl bg-[#070a14] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400">Socket.IO Live Channel</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
                  <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[9px] font-bold text-white">
                    AR
                  </div>
                  <span className="text-[11px] text-slate-300 truncate">Alex R. moved SFG-139 to Review</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
                  <div className="w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center text-[9px] font-bold text-white">
                    PS
                  </div>
                  <span className="text-[11px] text-slate-300 truncate">Priya S. approved PR #42</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Encrypted Team Chat (1 column) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1d]/80 border border-white/[0.08] hover:border-violet-500/30 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold w-fit mb-4">
                <MessageSquare className="w-3.5 h-3.5" /> Project Discussions
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">
                Encrypted Team Chat
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Dedicated rooms for every project with code formatting, mentions, and instant context.
              </p>
            </div>

            {/* Mini Chat Window */}
            <div className="p-3 rounded-2xl bg-[#070a14] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-white/[0.06]">
                <span className="font-mono text-slate-300">#sprint-24-core</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> E2E Encrypted
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-lg bg-violet-950/30 border border-violet-500/20 text-[11px]">
                  <span className="font-bold text-violet-300">Sarah L.:</span>{" "}
                  <span className="text-slate-300">Auth migration is ready for review on staging!</span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03] text-[11px]">
                  <span className="font-bold text-slate-300">David C.:</span>{" "}
                  <span className="text-slate-400">Merged PR #128. Tests passed with 100% coverage.</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 5: Granular Roles & Governance (1 column) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1d]/80 border border-white/[0.08] hover:border-violet-500/30 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold w-fit mb-4">
                <ShieldCheck className="w-3.5 h-3.5" /> Enterprise RBAC
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">
                Granular Permissions
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Explicit workspace governance with Admin, Project Lead, Developer, and Guest roles.
              </p>
            </div>

            {/* Role Badges Preview */}
            <div className="p-3.5 rounded-2xl bg-[#070a14] border border-white/[0.06] space-y-2">
              {[
                { role: "Owner / Admin", perm: "Full Workspace Control", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
                { role: "Project Manager", perm: "Sprint & Scope Governance", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
                { role: "Core Developer", perm: "Task & Branch Execution", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.color}`}>
                    {item.role}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.perm}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 6: AI Health & Predictive Insights (Span 3 columns on lg) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-3 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c1226] to-[#070b16] border border-violet-500/30 shadow-[0_10px_40px_rgba(124,92,255,0.15)] relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold w-fit mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Automated Sprint Diagnostics
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 font-display">
                  Automated Sprint Health & Blocker Detection
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  SprintForge continuously correlates commits, pull requests, and task cycle times. You get proactive recommendations to prevent delays before they impact delivery dates.
                </p>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Real-time burndown regression detection</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Automated blocker mitigation proposals</span>
                  </div>
                </div>
              </div>

              {/* Interactive Health Gauge Box */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-[#060914] border border-violet-500/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <span className="text-xs font-bold text-white">Sprint Health Index</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">94% OPTIMAL</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Target Completion Probability</span>
                    <span className="text-violet-300 font-semibold">96.8%</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 rounded-full w-[94%]" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/20 text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-violet-300">AI Insight:</span>{" "}
                  &quot;Velocity is 18% higher than average. You have capacity to pull SFG-142 into current sprint.&quot;
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
