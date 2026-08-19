"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Kanban,
  Clock,
  BarChart3,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GitPullRequest,
  Users,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
} from "lucide-react";

export function InteractiveSandbox() {
  const [activeTab, setActiveTab] = useState<"board" | "timeline" | "analytics" | "ai">("board");

  return (
    <section id="interactive-demo" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Layers className="w-3 h-3" /> Live Sandbox
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display mb-6">
            Test-drive the <br />
            <span className="gradient-text">SprintForge Workspace.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Switch between views to experience how SprintForge unifies high-speed Kanban, visual timelines, burndown analytics, and AI foresight.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#090d19] border border-white/[0.08] backdrop-blur-xl">
            {[
              { id: "board", label: "Scrum Board", icon: Kanban },
              { id: "timeline", label: "Gantt Timeline", icon: Clock },
              { id: "analytics", label: "Burndown Analytics", icon: BarChart3 },
              { id: "ai", label: "AI Copilot Feed", icon: Cpu },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    isActive ? "text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sandbox Content Screen */}
        <div className="rounded-3xl bg-[#090d19] border border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-4 sm:p-8 min-h-[480px]">
          <AnimatePresence mode="wait">
            {activeTab === "board" && (
              <motion.div
                key="board"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-base font-bold text-white">Sprint 24 Board (Interactive)</h3>
                    <p className="text-xs text-slate-400">14 of 18 tasks completed · 4 in progress</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      Live Velocity: 94.2%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Column 1 */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>In Progress</span>
                      <span className="text-[10px] bg-white/[0.06] px-2 py-0.5 rounded text-slate-400">2</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0c1224] border border-violet-500/30 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-violet-400 font-mono text-[10px] font-bold">SFG-138</span>
                        <span className="text-[9px] font-bold text-rose-400 uppercase">Critical</span>
                      </div>
                      <div className="font-semibold text-white">AI Sprint Velocity Forecasting Engine</div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <span>Assigned to Sarah L.</span>
                        <span className="text-violet-300 font-mono">3/4 subtasks</span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0c1224] border border-white/[0.06] text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-mono text-[10px]">SFG-141</span>
                        <span className="text-[9px] font-bold text-amber-400 uppercase">High</span>
                      </div>
                      <div className="font-semibold text-white">Socket.IO real-time presence sync</div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <span>Assigned to Alex R.</span>
                        <span className="text-emerald-400 font-mono">2/2 subtasks</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Code Review</span>
                      <span className="text-[10px] bg-white/[0.06] px-2 py-0.5 rounded text-slate-400">1</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0c1224] border border-amber-500/30 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-amber-400 font-mono text-[10px] font-bold">SFG-134</span>
                        <span className="text-[9px] font-bold text-blue-400 uppercase">Medium</span>
                      </div>
                      <div className="font-semibold text-white">Passkey WebAuthn auth provider</div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <span>PR #88 · 2 approvals</span>
                        <span className="text-emerald-400 font-mono">Ready to merge</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Done</span>
                      <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">3</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0c1224] border border-emerald-500/30 text-xs space-y-2 opacity-85">
                      <div className="flex justify-between">
                        <span className="text-emerald-400 font-mono text-[10px]">SFG-128</span>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase">Completed</span>
                      </div>
                      <div className="font-semibold text-slate-200 line-through">
                        PostgreSQL read-replica indexing
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <span>Merged in v2.4-rc1</span>
                        <span className="text-emerald-400">✓ Done</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "timeline" && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-base font-bold text-white">Gantt Milestone Schedule</h3>
                    <p className="text-xs text-slate-400">Sprint 24 · Week 3 Release Roadmap</p>
                  </div>
                  <span className="text-xs font-mono text-violet-400">Release Target: Friday 18:00 UTC</span>
                </div>

                <div className="space-y-4">
                  {[
                    { task: "AI Forecasting Pipeline (SFG-138)", start: "Mon", end: "Wed", progress: 85, color: "from-violet-600 to-indigo-600" },
                    { task: "Real-time Multi-Cursor Engine (SFG-139)", start: "Tue", end: "Thu", progress: 100, color: "from-emerald-600 to-teal-600" },
                    { task: "Hardware Passkey Integration (SFG-142)", start: "Wed", end: "Fri", progress: 60, color: "from-amber-600 to-orange-600" },
                    { task: "Staging Canary Load Testing", start: "Thu", end: "Fri", progress: 40, color: "from-blue-600 to-cyan-600" },
                  ].map((row, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-white">
                        <span>{row.task}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{row.progress}% Complete</span>
                      </div>
                      <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${row.color} rounded-full transition-all duration-700`}
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Start: {row.start}</span>
                        <span>Due: {row.end}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-base font-bold text-white">Burndown & Cycle Time Metrics</h3>
                    <p className="text-xs text-slate-400">Comparing ideal velocity against live team commits</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">Cycle Time: 1.8 days (-28%)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <div className="text-[11px] text-slate-400">Total Story Points</div>
                    <div className="text-2xl font-black text-white font-mono">56 SP</div>
                    <div className="text-[10px] text-emerald-400">+12% vs Sprint 23</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <div className="text-[11px] text-slate-400">Pull Request Merge Speed</div>
                    <div className="text-2xl font-black text-white font-mono">3.4 hrs</div>
                    <div className="text-[10px] text-emerald-400">Top 5% among dev teams</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <div className="text-[11px] text-slate-400">Sprint Health Score</div>
                    <div className="text-2xl font-black text-violet-400 font-mono">94 / 100</div>
                    <div className="text-[10px] text-violet-300">0 open critical blockers</div>
                  </div>
                </div>

                {/* Visual Chart Representation */}
                <div className="p-5 rounded-2xl bg-[#060a15] border border-white/[0.06] space-y-3">
                  <div className="flex justify-between text-xs text-slate-300 font-semibold">
                    <span>Sprint Burndown Trajectory</span>
                    <span className="text-violet-400">Ideal vs Actual (Green)</span>
                  </div>
                  <div className="h-32 flex items-end gap-3 pt-4 px-2">
                    {[56, 48, 38, 30, 22, 14, 8].map((pts, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div
                          className="w-full bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-lg transition-all duration-500"
                          style={{ height: `${(pts / 56) * 100}%` }}
                        />
                        <span className="text-[10px] font-mono text-slate-500">Day {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-base font-bold text-white">Live AI Copilot Intelligence Feed</h3>
                    <p className="text-xs text-slate-400">Automated event stream with proactive mitigation</p>
                  </div>
                  <span className="text-xs font-mono text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                    Realtime Monitoring
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      time: "10 mins ago",
                      tag: "Optimization",
                      title: "PR #128 merged with 100% test pass rate",
                      desc: "Burndown velocity increased by 4%. Sprint 24 completion probability adjusted to 96.4%.",
                      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                    },
                    {
                      time: "45 mins ago",
                      tag: "Workload Alert",
                      title: "Elena Rostova allocated 4 concurrent backend tickets",
                      desc: "AI recommends delegating SFG-145 to Alex Rivera to maintain sub-2-day cycle time.",
                      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                    },
                    {
                      time: "2 hours ago",
                      tag: "Auto-Grooming",
                      title: "Sprint 25 backlog automatically populated",
                      desc: "12 unassigned user stories groomed and tagged with story-point estimates based on codebase complexity.",
                      color: "text-violet-300 bg-violet-500/10 border-violet-500/20",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.color}`}>
                          {item.tag}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{item.time}</span>
                      </div>
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
