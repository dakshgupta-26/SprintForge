"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addWeeks, addDays, differenceInBusinessDays, differenceInCalendarDays, parseISO } from "date-fns";
import {
  X,
  Plus,
  Calendar as CalendarIcon,
  Target,
  Users,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Sparkles,
  Layers,
  Check,
  Flag,
} from "lucide-react";
import { sprintAPI, taskAPI } from "@/lib/api";
import { generateAvatar, cn } from "@/lib/utils";
import { DatePicker } from "@/components/shared/DatePicker";
import toast from "react-hot-toast";

interface CreateSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  projectColor?: string;
  existingSprints?: any[];
  projectMembers?: any[];
  onSprintCreated: (newSprint: any) => void;
}

export function CreateSprintModal({
  isOpen,
  onClose,
  projectId,
  projectName = "TASKDEV",
  projectColor = "#6366f1",
  existingSprints = [],
  projectMembers = [],
  onSprintCreated,
}: CreateSprintModalProps) {
  // ── Calculate Next Sprint Name & Sequence ──
  const suggestedNextName = useMemo(() => {
    if (!existingSprints || existingSprints.length === 0) return "Sprint 1";
    // Extract highest number from existing sprint names (e.g. "Sprint 12" -> 12)
    let maxNumber = 0;
    existingSprints.forEach((s) => {
      const match = s.name?.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const nextNum = maxNumber > 0 ? maxNumber + 1 : existingSprints.length + 1;
    return `Sprint ${nextNum}`;
  }, [existingSprints]);

  // ── Form State ──
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const twoWeeksLaterStr = useMemo(
    () => format(addWeeks(new Date(), 2), "yyyy-MM-dd"),
    []
  );

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(twoWeeksLaterStr);
  const [durationPreset, setDurationPreset] = useState<"1w" | "2w" | "3w" | "4w" | "custom">("2w");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backlog planning
  const [backlogTasks, setBacklogTasks] = useState<any[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [loadingBacklog, setLoadingBacklog] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(suggestedNextName);
      setGoal("");
      setStartDate(todayStr);
      setEndDate(twoWeeksLaterStr);
      setDurationPreset("2w");
      setSelectedTaskIds([]);

      // Fetch Backlog tasks for optional inclusion
      setLoadingBacklog(true);
      taskAPI
        .getBacklog(projectId)
        .then((res) => {
          setBacklogTasks(res.data || []);
        })
        .catch(() => setBacklogTasks([]))
        .finally(() => setLoadingBacklog(false));
    }
  }, [isOpen, suggestedNextName, todayStr, twoWeeksLaterStr, projectId]);

  // ── Duration Preset Handler ──
  const handleDurationPresetChange = (preset: "1w" | "2w" | "3w" | "4w" | "custom") => {
    setDurationPreset(preset);
    const start = startDate ? new Date(startDate) : new Date();
    if (preset === "1w") {
      setEndDate(format(addDays(start, 7), "yyyy-MM-dd"));
    } else if (preset === "2w") {
      setEndDate(format(addWeeks(start, 2), "yyyy-MM-dd"));
    } else if (preset === "3w") {
      setEndDate(format(addWeeks(start, 3), "yyyy-MM-dd"));
    } else if (preset === "4w") {
      setEndDate(format(addWeeks(start, 4), "yyyy-MM-dd"));
    }
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (!newStart) return;
    const start = new Date(newStart);
    if (durationPreset === "1w") {
      setEndDate(format(addDays(start, 7), "yyyy-MM-dd"));
    } else if (durationPreset === "2w") {
      setEndDate(format(addWeeks(start, 2), "yyyy-MM-dd"));
    } else if (durationPreset === "3w") {
      setEndDate(format(addWeeks(start, 3), "yyyy-MM-dd"));
    } else if (durationPreset === "4w") {
      setEndDate(format(addWeeks(start, 4), "yyyy-MM-dd"));
    }
  };

  // ── Calculated Metrics ──
  const workingDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (e <= s) return 0;
      return Math.max(differenceInBusinessDays(e, s), 1);
    } catch {
      return 0;
    }
  }, [startDate, endDate]);

  const calendarDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (e <= s) return 0;
      return differenceInCalendarDays(e, s);
    } catch {
      return 0;
    }
  }, [startDate, endDate]);

  const isDateInvalid = useMemo(() => {
    if (!startDate || !endDate) return false;
    return new Date(endDate) <= new Date(startDate);
  }, [startDate, endDate]);

  // Historical velocity from completed sprints
  const historicalVelocity = useMemo(() => {
    const completed = existingSprints.filter((s) => s.status === "completed" && (s.completedPoints || s.velocity));
    if (completed.length === 0) return null;
    const total = completed.reduce((sum, s) => sum + (s.completedPoints || s.velocity || 0), 0);
    return Math.round(total / completed.length);
  }, [existingSprints]);

  // Selected tasks points
  const selectedPoints = useMemo(() => {
    return backlogTasks
      .filter((t) => selectedTaskIds.includes(t._id))
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  }, [backlogTasks, selectedTaskIds]);

  // Estimated team capacity
  const estimatedCapacity = useMemo(() => {
    const memberCount = Math.max(projectMembers.length, 1);
    // Rough heuristic: ~0.8-1 story point per dev per working day
    return Math.round(workingDays * memberCount * 0.85);
  }, [workingDays, projectMembers]);

  // Toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // ── Submit Sprint Creation ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Sprint name is required");
      return;
    }
    if (isDateInvalid) {
      toast.error("End date must be after start date");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: newSprint } = await sprintAPI.create({
        name: name.trim(),
        goal: goal.trim() || undefined,
        project: projectId,
        startDate,
        endDate,
      });

      // If user selected backlog tasks, add them to the new sprint
      if (selectedTaskIds.length > 0) {
        await Promise.all(
          selectedTaskIds.map((taskId) => sprintAPI.addTask(newSprint._id, taskId).catch(() => {}))
        );
      }

      toast.success(`${newSprint.name} created successfully! 🚀`);
      onSprintCreated(newSprint);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create sprint");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md">
        {/* Backdrop dismiss */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-[#090d1f] border border-white/[0.12] rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Top Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-4 flex-shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: projectColor }}
                >
                  {projectName.charAt(0)}
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {projectName}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                  {suggestedNextName}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Create Sprint
              </h2>
              <p className="text-xs text-slate-400">
                Plan a focused delivery cycle and align your engineering team.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Scroll Area */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
            {/* ── SECTION 1: SPRINT BASICS ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>Sprint Basics</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Sprint Name <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      Suggested: {suggestedNextName}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sprint 25 — Auth & Security"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all font-medium placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Sprint Goal <span className="text-slate-500 font-normal">(Recommended)</span>
                  </label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="What single outcome should the team accomplish by the end of this sprint?"
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all leading-relaxed placeholder:text-slate-600 resize-none font-sans"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-sans">
                    <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    A clear sprint goal keeps the team aligned on key product deliverables.
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: DURATION & CALENDAR ── */}
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Sprint Duration & Timeline</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {workingDays} working days ({calendarDays} days)
                </span>
              </div>

              {/* Duration Presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "1w", label: "1 Week" },
                  { id: "2w", label: "2 Weeks (Standard)" },
                  { id: "3w", label: "3 Weeks" },
                  { id: "4w", label: "4 Weeks" },
                  { id: "custom", label: "Custom" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleDurationPresetChange(preset.id as any)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                      durationPreset === preset.id
                        ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(124,92,255,0.4)] border border-violet-400/30"
                        : "bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 border border-white/[0.06]"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5">
                    Start Date
                  </label>
                  <DatePicker
                    value={startDate}
                    onChange={(val) => handleStartDateChange(val)}
                    placeholder="Select start date"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5">
                    End Date
                  </label>
                  <DatePicker
                    value={endDate}
                    minDate={startDate}
                    onChange={(val) => {
                      setEndDate(val);
                      setDurationPreset("custom");
                    }}
                    placeholder="Select end date"
                  />
                </div>
              </div>

              {isDateInvalid && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>End date must be strictly after the start date.</span>
                </div>
              )}
            </div>

            {/* ── SECTION 3: TEAM CAPACITY & PLANNING SIGNALS ── */}
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  <span>Team Capacity & Signals</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {projectMembers.length} developer{projectMembers.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Available Capacity</p>
                  <p className="text-base font-bold text-white mt-0.5">
                    ~{estimatedCapacity} <span className="text-xs font-normal text-slate-400">pts</span>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Historical Velocity</p>
                  <p className="text-base font-bold text-cyan-400 mt-0.5">
                    {historicalVelocity ? `${historicalVelocity} pts` : "Calibrating..."}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Selected Backlog Load</p>
                  <p className="text-base font-bold text-violet-300 mt-0.5">
                    {selectedPoints} pts{" "}
                    <span className="text-[11px] font-normal text-slate-400">
                      ({selectedTaskIds.length} tasks)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECTION 4: OPTIONAL BACKLOG PREVIEW ── */}
            {backlogTasks.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
                    <Target className="w-3.5 h-3.5" />
                    <span>Pull from Backlog ({backlogTasks.length} available)</span>
                  </div>
                  {selectedTaskIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTaskIds([])}
                      className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      Clear selected ({selectedTaskIds.length})
                    </button>
                  )}
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 divide-y divide-white/[0.04] bg-[#060914] rounded-2xl p-2 border border-white/[0.06]">
                  {backlogTasks.slice(0, 8).map((task) => {
                    const isSelected = selectedTaskIds.includes(task._id);
                    return (
                      <div
                        key={task._id}
                        onClick={() => toggleTaskSelection(task._id)}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all",
                          isSelected
                            ? "bg-violet-500/15 border border-violet-500/30 text-white"
                            : "hover:bg-white/[0.03] text-slate-300 border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={cn(
                              "w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0",
                              isSelected
                                ? "bg-violet-600 border-violet-400 text-white"
                                : "border-white/[0.2] bg-white/[0.02]"
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">
                            SFG-{task._id.slice(-4).toUpperCase()}
                          </span>
                          <span className="truncate font-medium">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/[0.06] rounded text-slate-400">
                            {task.storyPoints || 0} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SECTION 5: LIVE SPRINT REVIEW SUMMARY ── */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-900/20 via-indigo-900/10 to-transparent border border-violet-500/25 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-violet-400" />
                  Sprint Summary: {name || suggestedNextName}
                </span>
                <span className="text-[11px] font-mono text-cyan-300">
                  {workingDays} Working Days
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Goal: {goal.trim() ? goal : "No specific goal defined yet"}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                <span>
                  Dates: {startDate ? format(new Date(startDate), "MMM d") : "—"} →{" "}
                  {endDate ? format(new Date(endDate), "MMM d, yyyy") : "—"}
                </span>
                <span>•</span>
                <span>Team: {projectMembers.length} Members</span>
                <span>•</span>
                <span>Load: {selectedPoints} pts</span>
              </div>
            </div>
          </form>

          {/* Bottom Actions Footer */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isDateInvalid || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(124,92,255,0.4)] hover:shadow-[0_0_28px_rgba(124,92,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Sprint...</span>
                </>
              ) : (
                <>
                  <span>Create Sprint</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
