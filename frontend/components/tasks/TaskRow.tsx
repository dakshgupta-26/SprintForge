"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  Circle,
  Clock,
  Flag,
  ArrowRight,
  ExternalLink,
  Layers,
  FolderKanban,
  Zap,
  Bug,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { getStatusConfig } from "@/lib/statusConfig";
import { generateAvatar, formatDate, cn } from "@/lib/utils";

interface TaskRowProps {
  task: any;
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, currentStatus: string) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  task: <Layers className="w-3 h-3 text-blue-400" />,
  story: <Zap className="w-3 h-3 text-amber-400" />,
  bug: <Bug className="w-3 h-3 text-rose-400" />,
  epic: <BookOpen className="w-3 h-3 text-purple-400" />,
};

export function TaskRow({ task, onSelectTask, onToggleComplete }: TaskRowProps) {
  const isDone = task.status === "done";
  const statusCfg = getStatusConfig(task.status);

  // Compute Task Key
  const projectKey = task.project?.key || "SFG";
  const shortId = task._id ? task._id.slice(-4).toUpperCase() : "0001";
  const taskKey = `${projectKey}-${shortId}`;

  // Due Date calculation
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) &&
    !isDone;

  const isDueToday =
    task.dueDate &&
    new Date(task.dueDate).toDateString() === new Date().toDateString() &&
    !isDone;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "group relative flex items-center gap-3.5 sm:gap-4 px-4 py-3 sm:py-3.5 rounded-2xl border transition-all duration-150 cursor-pointer overflow-hidden",
        isDone
          ? "bg-[#070b1a]/50 border-white/[0.04] hover:bg-[#070b1a]/80"
          : "bg-[#080d22] border-white/[0.07] hover:border-violet-500/40 hover:bg-[#0a112c] shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      )}
      onClick={() => onSelectTask(task._id)}
    >
      {/* ── Left Status Checkbox ── */}
      <button
        type="button"
        title={isDone ? "Mark as Incomplete" : "Mark as Done"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task._id, task.status);
        }}
        className={cn(
          "w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer",
          isDone
            ? "bg-emerald-500 border-emerald-400 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            : "border-white/[0.2] hover:border-violet-400 bg-white/[0.03] hover:bg-violet-500/10 text-transparent"
        )}
      >
        <Check className={cn("w-3.5 h-3.5 stroke-[3]", isDone ? "opacity-100" : "opacity-0")} />
      </button>

      {/* ── Task Key (Monospace) ── */}
      <span className="text-[11px] font-mono font-bold text-slate-400 group-hover:text-violet-300 transition-colors flex-shrink-0">
        {taskKey}
      </span>

      {/* ── Task Title ── */}
      <div className="flex-1 min-w-0 pr-2">
        <p
          className={cn(
            "text-xs sm:text-sm font-semibold truncate transition-colors",
            isDone
              ? "line-through text-slate-500 font-normal"
              : "text-white group-hover:text-violet-100"
          )}
        >
          {task.title}
        </p>
      </div>

      {/* ── Metadata Elements (Responsive) ── */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Project Badge */}
        {task.project?.name && (
          <span className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-slate-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-md">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: task.project.color || "#6366f1" }}
            />
            <span className="truncate max-w-[100px]">{task.project.name}</span>
          </span>
        )}

        {/* Sprint Badge */}
        {task.sprint?.name && (
          <span className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md">
            <span>{task.sprint.name}</span>
          </span>
        )}

        {/* Story Points */}
        {task.storyPoints !== undefined && task.storyPoints > 0 && (
          <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]">
            {task.storyPoints} SP
          </span>
        )}

        {/* Due Date Indicator */}
        {task.dueDate && (
          <span
            className={cn(
              "text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md flex items-center gap-1",
              isDone
                ? "text-slate-500 bg-white/[0.02]"
                : isOverdue
                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                : isDueToday
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                : "text-slate-400 bg-white/[0.03] border border-white/[0.06]"
            )}
          >
            <Clock className="w-2.5 h-2.5" />
            <span>
              {isOverdue
                ? "Overdue"
                : isDueToday
                ? "Due Today"
                : formatDate(task.dueDate, "short")}
            </span>
          </span>
        )}

        {/* Status Badge */}
        <span
          className={cn(
            "text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border",
            statusCfg.badgeStyle
          )}
        >
          {statusCfg.shortLabel}
        </span>

        {/* Priority Badge */}
        <span
          className={cn(
            "text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border hidden sm:inline-block",
            task.priority === "critical"
              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
              : task.priority === "high"
              ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
              : task.priority === "medium"
              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
          )}
        >
          {task.priority}
        </span>

        {/* Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectTask(task._id);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
