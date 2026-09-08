"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  FileCode,
  GitCommit,
  ArrowUp,
  ArrowDown,
  GitBranch,
  Plus,
  Trash2,
  Edit3,
  RotateCw,
  Clock,
} from "lucide-react";
import { codeAPI } from "@/lib/api";
import { useCodeStore } from "@/lib/store/codeStore";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

export function CodeActivityPanel() {
  const { projectId, openFile } = useCodeStore();
  const [activities, setActivities] = useState<any[]>([]);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const loadActivities = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await codeAPI.getCodeActivity(projectId, {
        action: filterAction !== "all" ? filterAction : undefined,
      });
      setActivities(data.activities || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [projectId, filterAction]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "committed":
        return <GitCommit className="w-3.5 h-3.5 text-violet-400" />;
      case "pushed":
        return <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />;
      case "pulled":
        return <ArrowDown className="w-3.5 h-3.5 text-blue-400" />;
      case "branch_created":
      case "branch_switched":
        return <GitBranch className="w-3.5 h-3.5 text-cyan-400" />;
      case "created":
        return <Plus className="w-3.5 h-3.5 text-emerald-400" />;
      case "deleted":
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Edit3 className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#070a18] select-none text-slate-300 text-xs">
      {/* ── Top Header ── */}
      <div className="h-9 px-3 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#070a18]">
        <div className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-mono font-bold uppercase text-[11px] text-slate-300">
            Activity & Audit
          </span>
        </div>

        <button
          type="button"
          onClick={loadActivities}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Refresh Activity"
        >
          <RotateCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-violet-400")} />
        </button>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="p-1.5 border-b border-white/[0.06] flex items-center gap-1 overflow-x-auto scrollbar-none text-[10px] font-mono">
        {["all", "modified", "committed", "pushed", "created"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilterAction(f)}
            className={cn(
              "px-2 py-0.5 rounded uppercase font-bold transition-colors cursor-pointer",
              filterAction === f
                ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Activities Timeline ── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            <Clock className="w-5 h-5 text-slate-600 mx-auto mb-1" />
            <p>No activity records recorded yet</p>
          </div>
        ) : (
          activities.map((act) => {
            const timeAgo = formatDistanceToNow(new Date(act.timestamp || act.createdAt), {
              addSuffix: true,
            });
            const exactTime = format(new Date(act.timestamp || act.createdAt), "MMM d, yyyy · h:mm a");

            return (
              <div
                key={act._id}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {getActionIcon(act.action)}
                    <span className="font-semibold text-white truncate">
                      {act.user?.name || "Collaborator"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500" title={exactTime}>
                    {timeAgo}
                  </span>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {act.details || `${act.action} ${act.file || ""}`}
                </p>

                {act.file && (
                  <button
                    type="button"
                    onClick={() => openFile(act.file)}
                    className="flex items-center gap-1 text-[10px] font-mono text-violet-400 hover:underline pt-0.5 cursor-pointer"
                  >
                    <FileCode className="w-3 h-3" />
                    <span className="truncate">{act.file}</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
