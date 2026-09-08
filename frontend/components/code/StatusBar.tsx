"use client";

import React from "react";
import {
  GitBranch,
  ArrowUp,
  ArrowDown,
  Check,
  Users,
  Terminal,
  ShieldCheck,
  FileCode,
} from "lucide-react";
import { useCodeStore, getLanguageFromPath } from "@/lib/store/codeStore";
import { cn } from "@/lib/utils";

export function StatusBar() {
  const {
    gitStatus,
    activeTabId,
    collaborators,
    terminalOpen,
    toggleTerminal,
    setActiveActivityBarView,
    permission,
  } = useCodeStore();

  const language = activeTabId ? getLanguageFromPath(activeTabId) : "TypeScript";
  const branch = gitStatus?.branch || "main";
  const ahead = gitStatus?.ahead || 0;
  const behind = gitStatus?.behind || 0;
  const collabCount = collaborators.length;

  return (
    <div className="h-6 bg-[#060916] border-t border-white/[0.08] flex items-center justify-between px-3 text-[11px] font-mono text-slate-400 select-none flex-shrink-0 z-30">
      {/* ── Left Status Indicators ── */}
      <div className="flex items-center gap-3">
        {/* Active Branch */}
        <button
          type="button"
          onClick={() => setActiveActivityBarView("git")}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          title={`Active Branch: ${branch}`}
        >
          <GitBranch className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-semibold text-slate-300">{branch}</span>
        </button>

        {/* Sync Status */}
        <div className="flex items-center gap-1.5 text-slate-400">
          {ahead === 0 && behind === 0 ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="w-3 h-3" />
              <span>Synced</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              {behind > 0 && (
                <span className="flex items-center text-blue-400">
                  <ArrowDown className="w-3 h-3" />
                  {behind}
                </span>
              )}
              {ahead > 0 && (
                <span className="flex items-center text-violet-400">
                  <ArrowUp className="w-3 h-3" />
                  {ahead}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Permission Role */}
        <div className="hidden sm:flex items-center gap-1 text-slate-500">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] uppercase font-bold text-slate-400">
            {permission}
          </span>
        </div>
      </div>

      {/* ── Right Status Indicators ── */}
      <div className="flex items-center gap-3.5">
        {/* Terminal Toggle Button */}
        <button
          type="button"
          onClick={() => toggleTerminal()}
          className={cn(
            "flex items-center gap-1 hover:text-white transition-colors cursor-pointer",
            terminalOpen && "text-violet-300"
          )}
          title="Toggle Terminal"
        >
          <Terminal className="w-3 h-3 text-violet-400" />
          <span className="hidden sm:inline">Terminal</span>
        </button>

        {/* Live Collaborators Count */}
        <div
          className="flex items-center gap-1 text-violet-300 font-semibold"
          title={`${collabCount} active collaborators`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Users className="w-3 h-3 text-violet-400" />
          <span>{collabCount}</span>
        </div>

        {/* Formatting Settings */}
        <span className="hidden md:inline text-slate-500">Spaces: 2</span>
        <span className="hidden md:inline text-slate-500">UTF-8</span>
        <span className="hidden md:inline text-slate-500">LF</span>

        {/* Language Mode */}
        <span className="text-violet-400 font-semibold uppercase text-[10px]">
          {language}
        </span>
      </div>
    </div>
  );
}
