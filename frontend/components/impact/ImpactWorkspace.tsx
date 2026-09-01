"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Zap,
  ShieldAlert,
  AlertTriangle,
  GitBranch,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Clock,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Users,
  Search,
} from "lucide-react";
import { impactAPI } from "@/lib/api";
import { useProjectStore } from "@/lib/store/projectStore";
import { ImpactAnalysisData, Recommendation } from "./types";
import { DependencyGraphView } from "./DependencyGraphView";
import { CriticalPathTimeline } from "./CriticalPathTimeline";
import { RiskRadarCard } from "./RiskRadarCard";
import { RecommendationsCard } from "./RecommendationsCard";
import { WhatIfSimulatorModal } from "./WhatIfSimulatorModal";
import { WorkspaceBootLoader, WorkspaceStage } from "@/components/shared/WorkspaceBootLoader";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ImpactWorkspaceProps {
  projectId: string;
}

const IMPACT_BOOT_STAGES: WorkspaceStage[] = [
  { id: "graph", label: "Constructing dependency graph", completedLabel: "Graph vertices loaded" },
  { id: "cpm", label: "Calculating Critical Path Method", completedLabel: "Critical path analyzed" },
  { id: "risk", label: "Evaluating multi-factor risk scores", completedLabel: "Risk evaluation complete" },
  { id: "recs", label: "Generating explainable recommendations", completedLabel: "Impact Engine ready" },
];

export function ImpactWorkspace({ projectId }: ImpactWorkspaceProps) {
  const { currentProject, projects } = useProjectStore();
  const [data, setData] = useState<ImpactAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bootStageIndex, setBootStageIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<"graph" | "critical_path" | "radar" | "recommendations">("graph");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simulatorTaskId, setSimulatorTaskId] = useState<string | null>(null);

  const loadImpactAnalysis = useCallback(async () => {
    setIsLoading(true);
    setBootStageIndex(0);
    try {
      setBootStageIndex(1);
      const res = await impactAPI.getProjectImpact(projectId);
      setBootStageIndex(2);
      setTimeout(() => setBootStageIndex(3), 150);
      setData(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load impact analysis");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadImpactAnalysis();
  }, [loadImpactAnalysis]);

  const handleOpenSimulator = (taskId?: string) => {
    setSimulatorTaskId(taskId || selectedTaskId || null);
    setSimulatorOpen(true);
  };

  const handleApplyRecommendation = (rec: Recommendation) => {
    setSimulatorTaskId(rec.targetTaskId);
    setSimulatorOpen(true);
  };

  const project = currentProject?._id === projectId ? currentProject : projects.find((p) => p._id === projectId);
  const projectMembers = (project?.members || []).map((m: any) => {
    const u = m.user || {};
    return {
      _id: String(u._id || m.user || m),
      name: u.name || "Team Member",
      avatar: u.avatar || "",
      email: u.email || "",
    };
  });

  if (isLoading || !data) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center p-4">
        <WorkspaceBootLoader
          variant="embedded"
          title="Impact Engine"
          subtitle="ENGINEERING INTELLIGENCE & SCHEDULE FORECASTING"
          stages={IMPACT_BOOT_STAGES}
          currentStageIndex={bootStageIndex}
          status="loading"
          onRetry={loadImpactAnalysis}
        />
      </div>
    );
  }

  const { health, criticalPath, tasks, edges, topRisks, recommendations, hasCycle, cycleNodes } = data;

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* ── 1. Header Banner & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300">
              <Activity className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Impact Engine</h1>
            <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 font-mono text-[10px] font-bold">
              PREDICTIVE ANALYSIS
            </span>
          </div>
          <p className="text-xs text-slate-400">
            See how changes propagate through your sprint before you make them
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadImpactAnalysis()}
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh Analysis"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenSimulator()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simulate Change</span>
          </button>
        </div>
      </div>

      {/* ── 2. Cycle Detection Warning Alert ── */}
      {hasCycle && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-white">Dependency Cycle Detected</h4>
            <p className="text-slate-300">
              A circular dependency was detected in this project graph ({cycleNodes?.join(" → ")}).
              Circular blockers prevent accurate schedule forecasting.
            </p>
          </div>
        </div>
      )}

      {/* ── 3. High-Level Sprint Health Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Sprint Health */}
        <div className="p-4 rounded-2xl bg-[#070b1a] border border-white/[0.08] space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Sprint Health
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-2xl font-bold font-mono",
                health.healthScore >= 80
                  ? "text-emerald-400"
                  : health.healthScore >= 50
                  ? "text-amber-400"
                  : "text-rose-400"
              )}
            >
              {health.healthScore}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({health.completionProbability}% probability)
            </span>
          </div>
        </div>

        {/* Metric 2: Projected Completion */}
        <div className="p-4 rounded-2xl bg-[#070b1a] border border-white/[0.08] space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Projected Completion
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-bold text-white font-mono">
              {new Date(health.projectedCompletionDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
            {health.projectedDelayDays > 0 ? (
              <span className="text-[10px] font-mono font-bold text-rose-400">
                (+{health.projectedDelayDays}d delay)
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-emerald-400">On Track</span>
            )}
          </div>
        </div>

        {/* Metric 3: Critical Path Length */}
        <div className="p-4 rounded-2xl bg-[#070b1a] border border-white/[0.08] space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Critical Path
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-rose-400 font-mono">
              {health.criticalTasksCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">bottleneck tasks</span>
          </div>
        </div>

        {/* Metric 4: Blocked Items */}
        <div className="p-4 rounded-2xl bg-[#070b1a] border border-white/[0.08] space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Blocked Tasks
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              {health.blockedTasksCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">waiting items</span>
          </div>
        </div>

        {/* Metric 5: At-Risk Tasks */}
        <div className="p-4 rounded-2xl bg-[#070b1a] border border-white/[0.08] space-y-1 col-span-2 sm:col-span-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            At-Risk Scope
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-violet-400 font-mono">
              {health.atRiskTasksCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">of {health.totalTasks} total</span>
          </div>
        </div>
      </div>

      {/* ── 4. Main Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
        {[
          { id: "graph", label: "Dependency Graph", icon: GitBranch },
          { id: "critical_path", label: `Critical Path (${criticalPath.length})`, icon: Zap },
          { id: "radar", label: `Risk Radar (${topRisks.length})`, icon: ShieldAlert },
          { id: "recommendations", label: `Recommendations (${recommendations.length})`, icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
                isActive
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-violet-400" : "text-slate-500")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 5. Tab Content Views ── */}
      <AnimatePresence mode="wait">
        {activeTab === "graph" && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <DependencyGraphView
              tasks={tasks}
              edges={edges}
              criticalPathIds={criticalPath}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onSimulateTask={handleOpenSimulator}
            />
          </motion.div>
        )}

        {activeTab === "critical_path" && (
          <motion.div
            key="critical_path"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <CriticalPathTimeline
              criticalPathIds={criticalPath}
              tasks={tasks}
              onSelectTask={setSelectedTaskId}
              onSimulateTask={handleOpenSimulator}
            />
          </motion.div>
        )}

        {activeTab === "radar" && (
          <motion.div
            key="radar"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <RiskRadarCard
              topRisks={topRisks}
              tasks={tasks}
              onSelectTask={setSelectedTaskId}
              onSimulateTask={handleOpenSimulator}
            />
          </motion.div>
        )}

        {activeTab === "recommendations" && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <RecommendationsCard
              recommendations={recommendations}
              onApplyRecommendation={handleApplyRecommendation}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 6. What-If Simulation Modal Drawer ── */}
      <WhatIfSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        projectId={projectId}
        sprintId={data.sprintId}
        tasks={tasks}
        initialTaskId={simulatorTaskId}
        projectMembers={projectMembers}
        onScenarioApplied={() => loadImpactAnalysis()}
      />
    </div>
  );
}
