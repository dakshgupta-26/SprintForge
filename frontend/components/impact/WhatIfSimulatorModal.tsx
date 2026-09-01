"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Sliders,
  TrendingDown,
  TrendingUp,
  Clock,
  User,
  AlertTriangle,
  RotateCcw,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { EnrichedTask, SimulationResult, Recommendation } from "./types";
import { SimulationComparisonCard } from "./SimulationComparisonCard";
import { DatePicker } from "@/components/shared/DatePicker";
import { impactAPI, taskAPI } from "@/lib/api";
import { UserAvatar } from "@/components/shared/UserAvatar";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  sprintId?: string;
  tasks: EnrichedTask[];
  initialTaskId?: string | null;
  projectMembers: Array<{ _id: string; name: string; avatar?: string; email?: string }>;
  onScenarioApplied?: () => void;
}

export function WhatIfSimulatorModal({
  isOpen,
  onClose,
  projectId,
  sprintId,
  tasks,
  initialTaskId,
  projectMembers,
  onScenarioApplied,
}: WhatIfSimulatorModalProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<number>(6);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [status, setStatus] = useState<string>("todo");
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>("");

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Sync initial task selection
  useEffect(() => {
    if (initialTaskId && tasks.some((t) => t._id === initialTaskId)) {
      setSelectedTaskId(initialTaskId);
    } else if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0]._id);
    }
  }, [initialTaskId, tasks, selectedTaskId]);

  // Load selected task defaults
  useEffect(() => {
    const task = tasks.find((t) => t._id === selectedTaskId);
    if (task) {
      setEstimatedHours(task.estimatedHours || 6);
      setAssigneeId(task.assignees[0]?._id || "");
      setStatus(task.status || "todo");
      setIsBlocked(task.status === "blocked");
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
      setSimulationResult(null);
    }
  }, [selectedTaskId, tasks]);

  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTaskId) return;

    setIsSimulating(true);
    try {
      const scenario = {
        taskId: selectedTaskId,
        estimatedHours,
        storyPoints: Math.round((estimatedHours / 6) * 10) / 10,
        assigneeId: assigneeId || undefined,
        status: isBlocked ? "blocked" : status,
        isBlocked,
        dueDate: dueDate || undefined,
      };

      const { data } = await impactAPI.simulate(projectId, scenario, sprintId);
      setSimulationResult(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Simulation failed");
    }
    setIsSimulating(false);
  };

  // Adjust effort preset (+1d, +2d, +3d, -1d)
  const adjustEffortDays = (deltaDays: number) => {
    setEstimatedHours((prev) => Math.max(2, prev + deltaDays * 6));
  };

  // Actually apply the simulated change to live database
  const handleApplyToLiveProject = async () => {
    if (!selectedTaskId) return;
    setIsApplying(true);
    try {
      await taskAPI.update(selectedTaskId, {
        estimatedHours,
        storyPoints: Math.round((estimatedHours / 6) * 10) / 10,
        assignees: assigneeId ? [assigneeId] : [],
        status: isBlocked ? "blocked" : status,
        dueDate: dueDate || undefined,
      });

      toast.success("Simulation changes successfully applied to live project!");
      onScenarioApplied?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to apply changes");
    }
    setIsApplying(false);
  };

  if (!isOpen) return null;

  const currentTask = tasks.find((t) => t._id === selectedTaskId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/[0.12] bg-[#070b1a] shadow-2xl overflow-hidden"
        >
          {/* ── 1. Top Header ── */}
          <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#090e24] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">What-If Impact Simulator</h3>
                <p className="text-xs text-slate-400">
                  Hypothetically test changes without altering live project data
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── 2. Scrollable Body ── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Scenario Configuration Form */}
            <form onSubmit={handleRunSimulation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Task Selection */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 font-bold mb-1.5">
                    Select Target Task
                  </label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#030611] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500"
                  >
                    {tasks.map((t) => (
                      <option key={t._id} value={t._id} className="bg-[#070b1a]">
                        {t.title} ({t.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignee Reassignment */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 font-bold mb-1.5">
                    Hypothetical Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#030611] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500"
                  >
                    <option value="" className="bg-[#070b1a]">Unassigned</option>
                    {projectMembers.map((m) => (
                      <option key={m._id} value={m._id} className="bg-[#070b1a]">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Effort Adjustment Slider + Presets */}
              <div className="p-4 rounded-2xl bg-[#04060f] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    Estimated Effort
                  </label>
                  <span className="font-mono text-xs font-bold text-violet-300">
                    {estimatedHours} hours (~{(estimatedHours / 6).toFixed(1)} working days)
                  </span>
                </div>

                <input
                  type="range"
                  min="2"
                  max="120"
                  step="2"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseInt(e.target.value, 10))}
                  className="w-full accent-violet-500 cursor-pointer"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-mono">Quick shifts:</span>
                  <button
                    type="button"
                    onClick={() => adjustEffortDays(1)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-mono font-semibold"
                  >
                    +1 Day (+6h)
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEffortDays(2)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-mono font-semibold"
                  >
                    +2 Days (+12h)
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEffortDays(3)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-mono font-semibold"
                  >
                    +3 Days (+18h)
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEffortDays(-1)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-mono font-semibold"
                  >
                    -1 Day (-6h)
                  </button>
                </div>
              </div>

              {/* Status & Due Date & Blocker Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 font-bold mb-1.5">
                    Task Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#030611] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500"
                  >
                    <option value="todo" className="bg-[#070b1a]">To Do</option>
                    <option value="in_progress" className="bg-[#070b1a]">In Progress</option>
                    <option value="in_review" className="bg-[#070b1a]">In Review</option>
                    <option value="done" className="bg-[#070b1a]">Done (Completed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 font-bold mb-1.5">
                    Target Due Date
                  </label>
                  <DatePicker
                    value={dueDate}
                    onChange={(val) => setDueDate(val)}
                    placeholder="Select due date"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#030611] border border-white/[0.1] h-[46px]">
                  <input
                    type="checkbox"
                    id="isBlockedToggle"
                    checked={isBlocked}
                    onChange={(e) => setIsBlocked(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                  <label htmlFor="isBlockedToggle" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Simulate Active Blocker
                  </label>
                </div>
              </div>

              {/* Run Simulation Trigger */}
              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-3 px-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-violet-600/30"
              >
                {isSimulating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Run What-If Impact Simulation</span>
              </button>
            </form>

            {/* ── 3. Simulation Results Display ── */}
            {simulationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t border-white/[0.08] space-y-4"
              >
                <SimulationComparisonCard result={simulationResult} />
              </motion.div>
            )}
          </div>

          {/* ── 4. Footer Actions ── */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#090e24] flex items-center justify-between gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
            >
              Close Simulator
            </button>

            {simulationResult && (
              <button
                type="button"
                onClick={handleApplyToLiveProject}
                disabled={isApplying}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-600/30"
              >
                {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Apply Scenario to Live Project</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
