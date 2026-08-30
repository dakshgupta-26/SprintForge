"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Clock,
  Sparkles,
  Layers,
  Bug,
  Flame,
  Check,
  MoreHorizontal,
  ArrowRight,
  Trash2,
  ExternalLink,
  Copy,
} from "lucide-react";
import { generateAvatar, formatDate, cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { getStatusConfig } from "@/lib/statusConfig";
import toast from "react-hot-toast";

interface TaskCardProps {
  task: any;
  density?: "comfortable" | "compact";
  isDragging?: boolean;
  onClick: () => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const TYPE_CONFIG = {
  story: { label: "FEAT", color: "text-purple-400 bg-purple-500/10 border-purple-500/30", icon: Sparkles },
  task: { label: "TASK", color: "text-blue-400 bg-blue-500/10 border-blue-500/30", icon: Layers },
  bug: { label: "BUG", color: "text-rose-400 bg-rose-500/10 border-rose-500/30", icon: Bug },
  epic: { label: "EPIC", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", icon: Flame },
};

const SEVERITY_BADGES: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export function TaskCard({
  task,
  density = "comfortable",
  isDragging = false,
  onClick,
  onStatusChange,
}: TaskCardProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const taskKey = `SFG-${task._id?.slice(-4).toUpperCase()}`;
  const typeInfo = TYPE_CONFIG[task.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.task;
  const TypeIcon = typeInfo.icon;

  // ── Centralized Status Visual Derivation ──
  const statusKey = task.boardColumn || task.status || "todo";
  const statusConfig = getStatusConfig(statusKey);
  const StatusIcon = statusConfig.indicatorIcon;
  const isDone = statusConfig.isDone;

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(taskKey);
    setCopied(true);
    toast.success(`Copied ${taskKey}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate).getTime() < Date.now() - 24 * 60 * 60 * 1000 &&
    !isDone;

  return (
    <motion.div
      layout
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border transition-all duration-200 shadow-sm group cursor-pointer space-y-2.5 overflow-hidden",
        statusConfig.cardBg,
        statusConfig.borderClass,
        density === "compact" ? "p-2.5 space-y-1.5" : "p-3.5",
        isDragging &&
          "scale-[1.02] shadow-[0_20px_40px_rgba(0,0,0,0.85)] z-50 ring-2 ring-violet-500/50 opacity-95",
        isDone && "border-emerald-500/30 bg-[#08171d]/90 hover:border-emerald-500/50"
      )}
      style={{
        boxShadow: isDragging
          ? `0 20px 40px -10px ${statusConfig.cardGlow || "rgba(0,0,0,0.8)"}`
          : undefined,
      }}
    >
      {/* ── Status Accent Line (Left edge highlight) ── */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-colors duration-200"
        style={{ backgroundColor: statusConfig.color }}
      />

      {/* ── Top Row: Key, Type, Status Pill, Priority ── */}
      <div className="flex items-center justify-between gap-1.5 pl-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Key with copy */}
          <button
            onClick={copyId}
            className="text-[10px] font-mono font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
            title="Click to copy ID"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <span className="group-hover:text-violet-300">{taskKey}</span>
            )}
          </button>

          {/* Type Badge */}
          <span
            className={cn(
              "text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border flex items-center gap-1 flex-shrink-0",
              typeInfo.color
            )}
          >
            <TypeIcon className="w-2.5 h-2.5" />
            <span>{typeInfo.label}</span>
          </span>

          {/* Status Indicator Dot/Badge */}
          <span
            className={cn(
              "text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border flex items-center gap-1 transition-colors duration-200",
              statusConfig.badgeStyle
            )}
            title={`Current status: ${statusConfig.label}`}
          >
            <StatusIcon className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">{statusConfig.shortLabel}</span>
          </span>
        </div>

        {/* Priority Badge (Independent of status) */}
        <span
          className={cn(
            "text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border flex-shrink-0",
            SEVERITY_BADGES[task.priority] || SEVERITY_BADGES.medium
          )}
        >
          {task.priority}
        </span>
      </div>

      {/* ── Title ── */}
      <div className="pl-1">
        <h3
          className={cn(
            "text-xs sm:text-sm font-bold text-white transition-colors leading-snug",
            isDone
              ? "text-slate-300 group-hover:text-emerald-300"
              : "group-hover:text-violet-200"
          )}
        >
          {task.title}
        </h3>
      </div>

      {/* ── Description Preview (Comfortable mode only) ── */}
      {density === "comfortable" && task.description && (
        <p className="pl-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
          {task.description.replace(/###.*/g, "")}
        </p>
      )}

      {/* ── Labels (if any) ── */}
      {task.labels?.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap pl-1 pt-0.5">
          {task.labels.slice(0, 2).map((label: string) => (
            <span
              key={label}
              className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.06]"
            >
              #{label}
            </span>
          ))}
        </div>
      )}

      {/* ── Bottom Row: Assignee, Estimate, Comments, Due Date ── */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04] text-[11px] font-mono text-slate-400 pl-1">
        <div className="flex items-center gap-2">
          {/* Assignee Avatar */}
          {task.assignees?.length > 0 ? (
            <div className="flex items-center gap-1">
              <UserAvatar
                src={task.assignees[0]?.avatar}
                name={task.assignees[0]?.name}
                size="xs"
                ringClassName="border border-white/[0.1]"
              />
              <span className="truncate max-w-[80px] text-[10px] text-slate-300">
                {task.assignees[0]?.name?.split(" ")[0]}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 italic">Unassigned</span>
          )}

          {/* Story Points */}
          {task.storyPoints ? (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {task.storyPoints} SP
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-[10px]",
                isOverdue
                  ? "text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-1 rounded"
                  : "text-slate-500"
              )}
              title={`Due: ${formatDate(task.dueDate, "short")}`}
            >
              <Clock className="w-2.5 h-2.5" />
              <span>{formatDate(task.dueDate, "short")}</span>
            </span>
          )}

          {/* Comments count */}
          {task.comments?.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <MessageSquare className="w-2.5 h-2.5" />
              <span>{task.comments.length}</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
