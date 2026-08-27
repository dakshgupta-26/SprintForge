"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Clock, Plus, Layers, Zap } from "lucide-react";
import { getStatusConfig } from "@/lib/statusConfig";
import { cn, formatDate } from "@/lib/utils";

interface TaskBoardViewProps {
  tasks: any[];
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, currentStatus: string) => void;
}

const COLUMNS = [
  { id: "todo", label: "To Do", color: "border-slate-500/30" },
  { id: "in_progress", label: "In Progress", color: "border-blue-500/30" },
  { id: "in_review", label: "In Review", color: "border-violet-500/30" },
  { id: "done", label: "Completed", color: "border-emerald-500/30" },
];

export function TaskBoardView({
  tasks,
  onSelectTask,
  onToggleComplete,
}: TaskBoardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter(
          (t) => (t.status || "todo") === col.id || (col.id === "in_review" && t.status === "review")
        );

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-3xl bg-[#090d1f]/70 border border-white/[0.08] p-3.5 space-y-3 min-h-[320px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1.5 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  {col.label}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-white/[0.06] text-slate-400">
                  {colTasks.length}
                </span>
              </div>
            </div>

            {/* Column Task Cards */}
            <div className="space-y-2 flex-1">
              {colTasks.length === 0 ? (
                <div className="h-28 rounded-2xl border border-dashed border-white/[0.06] flex items-center justify-center text-slate-600 text-xs font-mono">
                  No {col.label.toLowerCase()} tasks
                </div>
              ) : (
                colTasks.map((task) => {
                  const isDone = task.status === "done";
                  const projectKey = task.project?.key || "SFG";
                  const shortId = task._id ? task._id.slice(-4).toUpperCase() : "0001";
                  const taskKey = `${projectKey}-${shortId}`;

                  return (
                    <motion.div
                      key={task._id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => onSelectTask(task._id)}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5",
                        isDone
                          ? "bg-[#070b1a]/60 border-white/[0.04]"
                          : "bg-[#080d22] border-white/[0.08] hover:border-violet-500/40 hover:bg-[#0a112c] shadow-sm"
                      )}
                    >
                      {/* Top line: Task Key + Priority */}
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-slate-400">{taskKey}</span>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded uppercase font-bold",
                            task.priority === "critical"
                              ? "bg-rose-500/15 text-rose-300"
                              : task.priority === "high"
                              ? "bg-orange-500/15 text-orange-300"
                              : "bg-slate-500/10 text-slate-400"
                          )}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Title */}
                      <p
                        className={cn(
                          "text-xs font-semibold line-clamp-2",
                          isDone ? "line-through text-slate-500" : "text-white"
                        )}
                      >
                        {task.title}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[10px] text-slate-400 font-mono">
                        <span>{task.project?.name || "Workspace"}</span>
                        {task.dueDate && <span>{formatDate(task.dueDate, "short")}</span>}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
