"use client";

import React, { useState } from "react";
import { AlertCircle, Clock, ChevronRight, User } from "lucide-react";
import { formatDate, generateAvatar, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface AgingAndBlockedCardProps {
  blockedTasks: any[];
  agingTasks: any[];
  projectId: string;
}

export function AgingAndBlockedCard({
  blockedTasks = [],
  agingTasks = [],
  projectId,
}: AgingAndBlockedCardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"blocked" | "aging">("blocked");

  const currentList = tab === "blocked" ? blockedTasks : agingTasks;

  return (
    <div className="p-6 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-lg flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
            Risk Radar
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Blockers & Aging Work
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#060914] p-0.5">
          <button
            onClick={() => setTab("blocked")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
              tab === "blocked"
                ? "bg-rose-500/20 text-rose-300"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <span>Blockers</span>
            {blockedTasks.length > 0 && (
              <span className="text-[10px] font-mono bg-rose-500/30 px-1 rounded-full">
                {blockedTasks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("aging")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
              tab === "aging"
                ? "bg-amber-500/20 text-amber-300"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <span>Aging Work</span>
            {agingTasks.length > 0 && (
              <span className="text-[10px] font-mono bg-amber-500/30 px-1 rounded-full">
                {agingTasks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {currentList.length === 0 ? (
        <div className="h-52 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.06] rounded-2xl text-xs text-slate-500">
          {tab === "blocked"
            ? "🎉 No critical blockers currently open!"
            : "✓ No stagnant in-progress tasks found."}
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {currentList.map((task) => {
            const key = `SFG-${task._id.slice(-4).toUpperCase()}`;
            return (
              <div
                key={task._id}
                onClick={() =>
                  router.push(
                    `/dashboard/projects/${projectId}/${tab === "blocked" ? "issues" : "board"}`
                  )
                }
                className="p-3 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-white/[0.12] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-mono font-bold text-slate-400 group-hover:text-white transition-colors">
                      {key}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border",
                        tab === "blocked"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}
                    >
                      {tab === "blocked" ? "P0 Critical" : task.status?.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate leading-snug">
                    {task.title}
                  </p>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 flex-shrink-0">
                  <span>{formatDate(task.updatedAt || task.createdAt, "relative")}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
