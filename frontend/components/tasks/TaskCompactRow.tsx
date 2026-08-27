"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { getStatusConfig } from "@/lib/statusConfig";
import { formatDate, cn } from "@/lib/utils";

interface TaskCompactRowProps {
  task: any;
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, currentStatus: string) => void;
}

export function TaskCompactRow({
  task,
  onSelectTask,
  onToggleComplete,
}: TaskCompactRowProps) {
  const isDone = task.status === "done";
  const statusCfg = getStatusConfig(task.status);
  const projectKey = task.project?.key || "SFG";
  const shortId = task._id ? task._id.slice(-4).toUpperCase() : "0001";
  const taskKey = `${projectKey}-${shortId}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => onSelectTask(task._id)}
      className={cn(
        "group flex items-center gap-3 px-3.5 py-2 rounded-xl border transition-colors cursor-pointer text-xs",
        isDone
          ? "bg-[#070b1a]/40 border-white/[0.04] text-slate-500"
          : "bg-[#080d22] border-white/[0.06] hover:border-violet-500/30 text-white"
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task._id, task.status);
        }}
        className={cn(
          "w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer",
          isDone
            ? "bg-emerald-500 border-emerald-400 text-black"
            : "border-white/[0.2] hover:border-violet-400 bg-white/[0.02]"
        )}
      >
        <Check className={cn("w-3 h-3 stroke-[3]", isDone ? "opacity-100" : "opacity-0")} />
      </button>

      <span className="font-mono font-bold text-[10px] text-slate-400">
        {taskKey}
      </span>

      <span
        className={cn(
          "flex-1 truncate font-medium",
          isDone ? "line-through text-slate-500" : "text-slate-200"
        )}
      >
        {task.title}
      </span>

      {task.project?.name && (
        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
          {task.project.name}
        </span>
      )}

      <span
        className={cn(
          "text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border",
          statusCfg.badgeStyle
        )}
      >
        {statusCfg.shortLabel}
      </span>
    </motion.div>
  );
}
