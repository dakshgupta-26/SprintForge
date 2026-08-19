"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  Terminal,
  Zap,
  RefreshCw,
  Layers,
  Clock,
  ShieldCheck,
  Check,
} from "lucide-react";

interface AIQuery {
  id: string;
  label: string;
  badge: string;
  probability: number;
  summary: string;
  findings: { title: string; type: "success" | "warning" | "info" }[];
  suggestedAction: string;
}

const aiQueries: AIQuery[] = [
  {
    id: "health",
    label: "Analyze Sprint Health & Velocity",
    badge: "Recommended",
    probability: 94.2,
    summary: "Sprint 24 is trending 18% above target velocity. 14 of 18 planned story units are already in review or done.",
    findings: [
      { title: "Burndown rate is 1.4x faster than historical average", type: "success" },
      { title: "Zero critical bugs or regression alerts reported in CI/CD pipeline", type: "success" },
      { title: "Frontend pod has 6 spare story points available before cutoff", type: "info" },
    ],
    suggestedAction: "Pull SFG-142 (Passkey Auth) into current sprint to maximize delivery window.",
  },
  {
    id: "blockers",
    label: "Detect Scope Creep & Risk Dependencies",
    badge: "Risk Engine",
    probability: 88.6,
    summary: "Identified 1 cross-service dependency between Socket.IO chat threads and database indexing migration.",
    findings: [
      { title: "SFG-134 depends on completion of schema migration #44", type: "warning" },
      { title: "PR #128 has 2 pending approvals from senior backend reviewers", type: "info" },
      { title: "No downstream blockers for frontend deployment", type: "success" },
    ],
    suggestedAction: "Notify David Chen to expedite PR review #128 to unblock Socket.IO merge.",
  },
  {
    id: "workload",
    label: "Rebalance Engineering Workload",
    badge: "Auto-Balance",
    probability: 96.0,
    summary: "Workload distribution optimized across 8 active contributors with balanced cycle times.",
    findings: [
      { title: "Elena Rostova is at 95% capacity (4 backend tasks assigned)", type: "warning" },
      { title: "Alex Rivera and Priya Sharma have 20% buffer capacity", type: "success" },
      { title: "Estimated burnout risk is negligible (score: 1.2/10)", type: "success" },
    ],
    suggestedAction: "Reassign SFG-145 task testing to Alex Rivera to balance pod workload.",
  },
  {
    id: "standup",
    label: "Generate Automated Standup Digest",
    badge: "Zero-Meeting",
    probability: 99.1,
    summary: "Auto-compiled standup summary from GitHub commits, merged PRs, and Kanban status transitions.",
    findings: [
      { title: "12 commits and 3 pull requests merged in last 24 hours", type: "success" },
      { title: "All core deliverables on track for Friday staging release", type: "success" },
      { title: "Standup report sent to Slack channel #engineering-daily", type: "info" },
    ],
    suggestedAction: "Publish release candidate summary to stakeholders with one click.",
  },
];

export function AIAssistantSection() {
  const [activeQueryId, setActiveQueryId] = useState<string>("health");
  const [applied, setApplied] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const activeQuery = aiQueries.find((q) => q.id === activeQueryId) || aiQueries[0];

  const handleSelectQuery = (id: string) => {
    if (id === activeQueryId) return;
    setIsProcessing(true);
    setApplied(false);
    setActiveQueryId(id);
    setTimeout(() => setIsProcessing(false), 300);
  };

  const handleApply = () => {
    setApplied(true);
  };

  return (
    <section id="ai-advantage" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Radiance */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-violet-600/15 via-purple-600/10 to-indigo-600/15 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Sprint AI Copilot
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display mb-6">
            Your team&apos;s <br />
            <span className="gradient-text">AI-powered advantage.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Turn project data into decisions without adding another meeting. SprintForge AI monitors sprints, resolves bottlenecks, and suggests precise actions.
          </p>
        </div>

        {/* AI Terminal & Sandbox Shell */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Query Selector List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
              Select AI Diagnostic Scenario
            </div>

            {aiQueries.map((query) => {
              const isSelected = activeQueryId === query.id;
              return (
                <button
                  key={query.id}
                  onClick={() => handleSelectQuery(query.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                    isSelected
                      ? "bg-violet-950/40 border-violet-500/50 shadow-[0_4px_25px_rgba(124,92,255,0.2)] ring-1 ring-violet-500/30"
                      : "bg-[#0a0f1d]/70 border-white/[0.07] hover:border-white/[0.18] hover:bg-[#0d1326]"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-300"}`}>
                        {query.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="text-violet-400 font-medium">Confidence: {query.probability}%</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/[0.05] text-slate-400">
                        {query.badge}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isSelected
                        ? "text-violet-400 translate-x-1"
                        : "text-slate-500 group-hover:translate-x-0.5 group-hover:text-slate-300"
                    }`}
                  />
                </button>
              );
            })}

            {/* AI Guarantee Badge */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Hallucination Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                SprintForge AI models are strictly deterministic and trained directly on your repository activity, PR velocity, and sprint history.
              </p>
            </div>
          </div>

          {/* AI Terminal Output Card (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-[#090d19] border border-violet-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-hidden p-6 sm:p-8 relative">
              {/* Top Terminal Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white font-display">SprintForge Assistant v2.4</div>
                    <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Model: Sprint-Optimizer-XL · 42ms latency
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {activeQuery.probability}% ACCURACY
                  </span>
                </div>
              </div>

              {/* Dynamic Animated Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeQuery.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Executive Summary */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Sprint Analysis & Synthesis
                    </div>
                    <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06]">
                      {activeQuery.summary}
                    </p>
                  </div>

                  {/* Diagnostic Findings */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Detected Key Signals
                    </div>
                    <div className="space-y-2.5">
                      {activeQuery.findings.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-xl bg-[#060a15] border border-white/[0.05] text-xs"
                        >
                          {item.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : item.type === "warning" ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                          )}
                          <span className="text-slate-300 font-medium leading-normal">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Proposed Action Banner */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border border-violet-500/40 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                      <Zap className="w-4 h-4 text-violet-400" />
                      <span>Recommended Agile Action</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold">
                      {activeQuery.suggestedAction}
                    </p>

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={handleApply}
                        disabled={applied}
                        className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          applied
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                            : "btn-primary-glow text-white"
                        }`}
                      >
                        {applied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Action Applied to Workspace</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Apply Recommendation →</span>
                          </>
                        )}
                      </button>
                      {applied && (
                        <span className="text-[11px] text-emerald-400 font-medium animate-fadeInUp">
                          ✓ Sprint backlog automatically re-indexed
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
