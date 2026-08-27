"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { sprintAPI, taskAPI } from "@/lib/api";
import { useProjectStore } from "@/lib/store/projectStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Play,
  CheckCircle,
  Calendar,
  Target,
  Zap,
  Loader2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  Layers,
  Flame,
  BarChart3,
  Check,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { CreateSprintModal } from "@/components/sprints/CreateSprintModal";
import { differenceInDays, isAfter, isBefore } from "date-fns";

export default function SprintsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentProject, fetchProject } = useProjectStore();

  const [sprints, setSprints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProject(projectId);
    loadSprints();
  }, [projectId]);

  const loadSprints = async () => {
    try {
      setIsLoading(true);
      const { data } = await sprintAPI.getAll(projectId);
      setSprints(data || []);
    } catch {
      toast.error("Failed to load sprints");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      await sprintAPI.start(sprintId);
      toast.success("Sprint started! 🚀");
      loadSprints();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start sprint");
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    if (
      !window.confirm(
        "Complete this sprint? Unfinished tasks will automatically move to the backlog."
      )
    )
      return;
    try {
      await sprintAPI.complete(sprintId);
      toast.success("Sprint completed! 🎉");
      loadSprints();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to complete sprint");
    }
  };

  // Group sprints by status
  const activeSprint = useMemo(
    () => sprints.find((s) => s.status === "active") || null,
    [sprints]
  );
  const planningSprints = useMemo(
    () => sprints.filter((s) => s.status === "planning"),
    [sprints]
  );
  const completedSprints = useMemo(
    () => sprints.filter((s) => s.status === "completed"),
    [sprints]
  );

  // Overall Velocity Average
  const averageVelocity = useMemo(() => {
    if (completedSprints.length === 0) return null;
    const sum = completedSprints.reduce(
      (acc, s) => acc + (s.completedPoints || s.velocity || 0),
      0
    );
    return Math.round(sum / completedSprints.length);
  }, [completedSprints]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: currentProject?.color || "#6366f1" }}
            >
              {currentProject?.key?.charAt(0) || "P"}
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              {currentProject?.name || "PROJECT"}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              {sprints.length} total sprint{sprints.length === 1 ? "" : "s"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sprints
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage your team&apos;s sprint cycles, planning, and delivery velocity.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(124,92,255,0.35)] hover:shadow-[0_0_28px_rgba(124,92,255,0.55)] transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Sprint</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white/[0.02] border border-white/[0.04] rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : sprints.length === 0 ? (
        /* ── Premium Agile Empty State ── */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-8 sm:p-12 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-2xl text-center overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(124,92,255,0.2)]">
              <Zap className="w-8 h-8 text-violet-400" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
              Your first sprint starts here.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Turn your backlog into a focused delivery cycle, set a clear goal, and get your engineering team shipping.
            </p>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(124,92,255,0.45)] hover:shadow-[0_0_35px_rgba(124,92,255,0.65)] transition-all active:scale-95 cursor-pointer mb-8"
            >
              <Plus className="w-4 h-4" />
              <span>Create your first sprint</span>
            </button>

            {/* Agile Lifecycle Workflow Pill */}
            <div className="w-full pt-6 border-t border-white/[0.06]">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">
                Agile Delivery Workflow
              </p>
              <div className="flex items-center justify-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs font-mono text-slate-400 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300">
                  BACKLOG
                </span>
                <span className="text-slate-600">→</span>
                <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300">
                  PLAN
                </span>
                <span className="text-slate-600">→</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300">
                  BUILD
                </span>
                <span className="text-slate-600">→</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300">
                  REVIEW
                </span>
                <span className="text-slate-600">→</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  SHIP
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* ── 1. ACTIVE SPRINT HERO CARD ── */}
          {activeSprint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0e142e] via-[#090d1f] to-[#070a16] border border-violet-500/30 shadow-[0_15px_50px_-10px_rgba(124,92,255,0.15)] relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-violet-400 bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 rounded-full">
                      CURRENT SPRINT
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVE
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {activeSprint.name}
                    </h2>
                    {activeSprint.goal ? (
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        Goal: {activeSprint.goal}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 italic mt-0.5">
                        No sprint goal defined.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-violet-400" />
                      {formatDate(activeSprint.startDate, "short")} →{" "}
                      {formatDate(activeSprint.endDate, "short")}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                      {activeSprint.tasks?.length || 0} issues
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      {activeSprint.velocity || activeSprint.completedPoints || 0} story points
                    </span>
                  </div>
                </div>

                {/* Progress Bar & CTA */}
                {(() => {
                  const total = activeSprint.tasks?.length || 0;
                  const done =
                    activeSprint.tasks?.filter((t: any) => t.status === "done").length || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 flex-shrink-0 lg:w-72 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/[0.06]">
                      <div className="w-full space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Completion</span>
                          <span className="text-white font-bold">{pct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>{done} of {total} done</span>
                          <span>{total - done} remaining</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleCompleteSprint(activeSprint._id)}
                          className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                        >
                          Complete Sprint
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/projects/${projectId}/sprints/${activeSprint._id}`
                            )
                          }
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(124,92,255,0.4)] transition-all cursor-pointer"
                        >
                          <span>Open Board</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {/* ── 2. PLANNING SPRINTS SECTION ── */}
          {planningSprints.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-violet-400" />
                  <span>Planning Sprints ({planningSprints.length})</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {planningSprints.map((sprint) => {
                  const total = sprint.tasks?.length || 0;
                  return (
                    <motion.div
                      key={sprint._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-3xl bg-[#090d1e] border border-white/[0.08] hover:border-violet-500/30 transition-all flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            PLANNING
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {formatDate(sprint.startDate, "short")} →{" "}
                            {formatDate(sprint.endDate, "short")}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">{sprint.name}</h3>
                        {sprint.goal && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {sprint.goal}
                          </p>
                        )}
                        <p className="text-[11px] font-mono text-slate-500 mt-3">
                          {total} issue{total === 1 ? "" : "s"} planned
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/projects/${projectId}/sprints/${sprint._id}`
                            )
                          }
                          className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Plan Issues</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleStartSprint(sprint._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                          <Play className="w-3 h-3" />
                          <span>Start Sprint</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 3. SPRINT HISTORY TIMELINE ── */}
          {completedSprints.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Sprint History ({completedSprints.length})</span>
                </div>
                {averageVelocity && (
                  <span className="text-xs font-mono text-slate-400">
                    Avg. Velocity: <strong className="text-white">{averageVelocity} SP</strong>
                  </span>
                )}
              </div>

              <div className="divide-y divide-white/[0.04] rounded-3xl border border-white/[0.08] bg-[#080b18] overflow-hidden">
                {completedSprints.map((sprint) => {
                  const total = sprint.tasks?.length || 0;
                  const done =
                    sprint.tasks?.filter((t: any) => t.status === "done").length || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 100;

                  return (
                    <div
                      key={sprint._id}
                      onClick={() =>
                        router.push(
                          `/dashboard/projects/${projectId}/sprints/${sprint._id}`
                        )
                      }
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 mb-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                            {sprint.name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            Completed
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                          <span>
                            {formatDate(sprint.startDate, "short")} →{" "}
                            {formatDate(sprint.endDate, "short")}
                          </span>
                          <span>•</span>
                          <span>{sprint.completedPoints || sprint.velocity || 0} SP Delivered</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {pct}% Completion
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create Sprint Planning Modal ── */}
      <CreateSprintModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        projectName={currentProject?.name}
        projectColor={currentProject?.color}
        existingSprints={sprints}
        projectMembers={currentProject?.members}
        onSprintCreated={(newSprint) => {
          setSprints((prev) => [newSprint, ...prev]);
        }}
      />
    </div>
  );
}
