"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Clock,
  Flag,
  Sparkles,
  Layers,
  Bug,
  Flame,
  Check,
  Copy,
  AlertTriangle,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { generateAvatar, formatDate, cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface TaskCardProps {
  task: any;
  density?: "comfortable" | "compact";
  onClick: () => void;
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

export function TaskCard({ task, density = "comfortable", onClick }: TaskCardProps) {
  const [copied, setCopied] = useState(false);
  const taskKey = `SFG-${task._id?.slice(-4).toUpperCase()}`;
  const typeInfo = TYPE_CONFIG[task.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.task;
  const TypeIcon = typeInfo.icon;

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(taskKey);
    setCopied(true);
    toast.success(`Copied ${taskKey}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3.5 rounded-2xl bg-[#090d1f] border border-white/[0.08] hover:border-violet-500/40 hover:bg-[#0c1228] transition-all shadow-sm group cursor-pointer space-y-2.5",
        density === "compact" && "p-2.5 space-y-1.5"
      )}
    >
      {/* ── Top Row: Key & Type & Menu ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Key with copy */}
          <button
            onClick={copyId}
            className="text-[10px] font-mono font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
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
              "text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border flex items-center gap-1",
              typeInfo.color
            )}
          >
            <TypeIcon className="w-2.5 h-2.5" />
            <span>{typeInfo.label}</span>
          </span>
        </div>

        {/* Priority Badge */}
        <span
          className={cn(
            "text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border",
            SEVERITY_BADGES[task.priority] || SEVERITY_BADGES.medium
          )}
        >
          {task.priority}
        </span>
      </div>

      {/* ── Title ── */}
      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-violet-200 transition-colors leading-snug">
        {task.title}
      </h3>

      {/* ── Description Preview (Comfortable mode only) ── */}
      {density === "comfortable" && task.description && (
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
          {task.description.replace(/###.*/g, "")}
        </p>
      )}

      {/* ── Labels (if any) ── */}
      {task.labels?.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap pt-0.5">
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
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04] text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          {/* Assignee Avatar */}
          {task.assignees?.length > 0 ? (
            <div className="flex items-center gap-1">
              <img
                src={
                  task.assignees[0]?.avatar ||
                  generateAvatar(task.assignees[0]?.name || "U")
                }
                alt=""
                className="w-4 h-4 rounded-full object-cover border border-white/[0.1]"
                title={task.assignees[0]?.name}
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

        <div className="flex items-center gap-2.5">
          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-[10px]",
                isOverdue ? "text-rose-400 font-bold" : "text-slate-500"
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
    </div>
  );
}
