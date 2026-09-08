"use client";

import React, { useEffect, useState } from "react";
import {
  Code2,
  Check,
  RotateCw,
  Clock,
  Sparkles,
  Terminal,
  Files,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeWorkspaceSkeletonProps {
  onRetry?: () => void;
  onReload?: () => void;
  error?: string | null;
}

const INIT_STAGES = [
  { id: "connect", label: "Connecting to workspace" },
  { id: "files", label: "Loading project files" },
  { id: "editor", label: "Initializing editor models" },
  { id: "collab", label: "Connecting collaborators" },
];

export function CodeWorkspaceSkeleton({
  onRetry,
  onReload,
  error,
}: CodeWorkspaceSkeletonProps) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isSlow, setIsSlow] = useState(false);

  // Progressive stage stepper
  useEffect(() => {
    const t1 = setTimeout(() => setActiveStageIndex(1), 300);
    const t2 = setTimeout(() => setActiveStageIndex(2), 800);
    const t3 = setTimeout(() => setActiveStageIndex(3), 1400);
    const tSlow = setTimeout(() => setIsSlow(true), 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tSlow);
    };
  }, []);

  const handleReload = () => {
    if (onReload) {
      onReload();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] flex flex-col bg-[#070a18] overflow-hidden select-none">
      {/* ── Simulated Top Workspace Layout Chrome ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 1. Activity Bar Skeleton */}
        <div className="w-12 bg-[#090d1f] border-r border-white/[0.08] flex flex-col items-center justify-between py-2.5 flex-shrink-0">
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Files className="w-4 h-4" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/[0.03] flex items-center justify-center text-slate-600">
              <GitBranch className="w-4 h-4" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/[0.03] flex items-center justify-center text-slate-600">
              <Terminal className="w-4 h-4" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/[0.04] animate-pulse" />
        </div>

        {/* 2. Sidebar File Tree Skeleton */}
        <div className="w-64 border-r border-white/[0.08] bg-[#070a18] flex flex-col p-3 space-y-3 flex-shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="h-3.5 w-24 bg-white/[0.08] rounded animate-pulse" />
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-white/[0.05]" />
              <div className="w-4 h-4 rounded bg-white/[0.05]" />
            </div>
          </div>

          {/* Tree items skeleton */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 pl-1">
              <div className="w-3.5 h-3.5 rounded bg-violet-500/20" />
              <div className="h-3 w-16 bg-white/[0.08] rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2 pl-4">
              <div className="w-3.5 h-3.5 rounded bg-blue-500/20" />
              <div className="h-3 w-28 bg-white/[0.06] rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2 pl-4">
              <div className="w-3.5 h-3.5 rounded bg-yellow-500/20" />
              <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2 pl-1">
              <div className="w-3.5 h-3.5 rounded bg-amber-500/20" />
              <div className="h-3 w-24 bg-white/[0.07] rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2 pl-1">
              <div className="w-3.5 h-3.5 rounded bg-sky-500/20" />
              <div className="h-3 w-32 bg-white/[0.06] rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* 3. Center Editor Viewport Skeleton */}
        <div className="flex-1 flex flex-col bg-[#080c1e] min-w-0">
          {/* Tab Strip Skeleton */}
          <div className="h-10 border-b border-white/[0.08] bg-[#070a18] flex items-center px-2 gap-1">
            <div className="h-7 w-32 rounded-lg bg-[#0f142e] border border-white/[0.1] flex items-center px-2.5 gap-2">
              <div className="w-3 h-3 rounded bg-violet-400/40" />
              <div className="h-2.5 w-16 bg-white/[0.1] rounded" />
            </div>
            <div className="h-7 w-28 rounded-lg bg-white/[0.02] flex items-center px-2.5 gap-2">
              <div className="w-3 h-3 rounded bg-blue-400/20" />
              <div className="h-2.5 w-14 bg-white/[0.05] rounded" />
            </div>
          </div>

          {/* Breadcrumb line */}
          <div className="h-7 px-4 border-b border-white/[0.04] flex items-center gap-2 text-[11px] font-mono text-slate-600">
            <div className="h-2 w-12 bg-white/[0.04] rounded" />
            <span>&gt;</span>
            <div className="h-2 w-16 bg-white/[0.04] rounded" />
          </div>

          {/* Code lines shimmer */}
          <div className="flex-1 p-6 space-y-3 font-mono">
            {[90, 60, 45, 80, 70, 50, 85, 30, 65, 40].map((width, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="text-[11px] text-slate-700 w-4 text-right font-mono">
                  {idx + 1}
                </span>
                <div
                  style={{ width: `${width}%` }}
                  className="h-3 rounded bg-white/[0.04] animate-pulse"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status Bar Skeleton ── */}
      <div className="h-6 bg-[#060916] border-t border-white/[0.08] flex items-center justify-between px-3 text-[11px] font-mono text-slate-600">
        <div className="flex items-center gap-2">
          <div className="h-2 w-14 bg-white/[0.06] rounded" />
          <div className="h-2 w-12 bg-white/[0.06] rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 bg-white/[0.06] rounded" />
        </div>
      </div>

      {/* ── Centered Interactive Initialization Modal Overlay ── */}
      <div className="absolute inset-0 z-40 bg-[#070a18]/75 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#090d22] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-4 text-slate-200 text-center">
          {/* Header Icon */}
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_25px_rgba(139,92,246,0.25)]">
              <Code2 className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              {error
                ? "Workspace Initialization Error"
                : isSlow
                ? "Workspace is taking longer than expected"
                : "Initializing SprintForge Workspace"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {error
                ? error
                : isSlow
                ? "Checking server connection and filesystem buffers..."
                : "Preparing your collaborative development environment"}
            </p>
          </div>

          {/* Stepper Checklist */}
          {!error && (
            <div className="w-full max-w-xs mx-auto space-y-2 text-left pt-2 border-t border-white/[0.06]">
              {INIT_STAGES.map((stage, idx) => {
                const isCompleted = idx < activeStageIndex;
                const isActive = idx === activeStageIndex;
                const isPending = idx > activeStageIndex;

                return (
                  <div
                    key={stage.id}
                    className={cn(
                      "flex items-center justify-between text-xs py-0.5 transition-opacity",
                      isPending && "opacity-40",
                      isActive && "text-white font-medium",
                      isCompleted && "text-slate-400"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {isCompleted ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : isActive ? (
                          <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)] animate-ping" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        )}
                      </div>
                      <span>{stage.label}</span>
                    </div>

                    {isCompleted && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        ready
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-mono text-violet-400 animate-pulse">
                        loading...
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Timeout Recovery Actions */}
          {(isSlow || error) && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] transition-all cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={handleReload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Reload Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
