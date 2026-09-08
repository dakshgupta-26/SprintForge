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
  AlertCircle,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { useCodeStore, getLanguageFromPath } from "@/lib/store/codeStore";
import { cn } from "@/lib/utils";

export function StatusBar() {
  const {
    gitStatus,
    activeTabId,
    collaborators,
    problems,
    cursorPosition,
    ideSettings,
    bottomPanelOpen,
    toggleBottomPanel,
    setBottomPanelTab,
    setActiveActivityBarView,
    setSettingsModalOpen,
    permission,
  } = useCodeStore();

  const language = activeTabId ? getLanguageFromPath(activeTabId) : "TypeScript";
  const branch = gitStatus?.branch || "main";
  const ahead = gitStatus?.ahead || 0;
  const behind = gitStatus?.behind || 0;
  const collabCount = collaborators.length;

  const errorCount = problems.filter((p) => p.severity === "error").length;
  const warningCount = problems.filter((p) => p.severity === "warning").length;

  return (
    <footer className="h-6 bg-[#060914] border-t border-white/[0.08] flex items-center justify-between px-2.5 text-[11px] font-mono text-slate-400 select-none flex-shrink-0 z-30">
      {/* ── Left Status Indicators ── */}
      <div className="flex items-center gap-3">
        {/* Active Branch */}
        <button
          type="button"
          onClick={() => setActiveActivityBarView("git")}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          title={`Active Branch: ${branch}`}
        >
          <GitBranch className="w-3 h-3 text-violet-400" />
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
                <span className="flex items-center text-blue-400" title={`${behind} commits behind origin`}>
                  <ArrowDown className="w-3 h-3" />
                  {behind}
                </span>
              )}
              {ahead > 0 && (
                <span className="flex items-center text-violet-400" title={`${ahead} commits ahead of origin`}>
                  <ArrowUp className="w-3 h-3" />
                  {ahead}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Problems Counter Pill */}
        <button
          type="button"
          onClick={() => {
            setBottomPanelTab("problems");
          }}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={`${errorCount} errors, ${warningCount} warnings`}
        >
          <span className="flex items-center gap-0.5 text-rose-400">
            <AlertCircle className="w-3 h-3" />
            <span>{errorCount}</span>
          </span>
          <span className="flex items-center gap-0.5 text-amber-400 ml-1">
            <AlertTriangle className="w-3 h-3" />
            <span>{warningCount}</span>
          </span>
        </button>

        {/* Permission Role */}
        <div className="hidden sm:flex items-center gap-1 text-slate-500">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] uppercase font-bold text-slate-400">
            {permission}
          </span>
        </div>
      </div>

      {/* ── Right Status Indicators ── */}
      <div className="flex items-center gap-3">
        {/* Terminal Toggle Button */}
        <button
          type="button"
          onClick={() => toggleBottomPanel()}
          className={cn(
            "flex items-center gap-1 hover:text-white transition-colors cursor-pointer",
            bottomPanelOpen && "text-violet-300"
          )}
          title="Toggle Integrated Terminal (Ctrl+`)"
        >
          <Terminal className="w-3 h-3 text-violet-400" />
          <span className="hidden sm:inline">Terminal</span>
        </button>

        {/* Live Collaborators Count */}
        <button
          type="button"
          onClick={() => setActiveActivityBarView("collab")}
          className="flex items-center gap-1 text-violet-300 font-semibold hover:text-violet-200 transition-colors cursor-pointer"
          title={`${collabCount} active collaborator${collabCount === 1 ? "" : "s"}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Users className="w-3 h-3 text-violet-400" />
          <span>{collabCount}</span>
        </button>

        {/* Cursor Position (Ln X, Col Y) */}
        <span className="text-slate-300">
          Ln {cursorPosition.line}, Col {cursorPosition.column}
          {cursorPosition.selectionCount ? ` (${cursorPosition.selectionCount} selected)` : ""}
        </span>

        {/* Indent & Encoding */}
        <span className="hidden md:inline text-slate-500">
          Spaces: {ideSettings.tabSize}
        </span>
        <span className="hidden md:inline text-slate-500">UTF-8</span>
        <span className="hidden md:inline text-slate-500">LF</span>

        {/* Language Mode */}
        <span className="text-violet-400 font-semibold uppercase text-[10px]">
          {language}
        </span>

        {/* Settings Quick Icon */}
        <button
          type="button"
          onClick={() => setSettingsModalOpen(true)}
          className="hover:text-white transition-colors cursor-pointer"
          title="Editor Settings"
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>
    </footer>
  );
}
