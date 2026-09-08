"use client";

import React, { useState } from "react";
import {
  Code2,
  GitBranch,
  ChevronDown,
  Check,
  RotateCw,
  Search,
  Command,
  Play,
  Bug,
  Users,
  Settings,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { GitHubIcon } from "@/components/shared/GitHubIcon";
import { useCodeStore } from "@/lib/store/codeStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { cn } from "@/lib/utils";

export function CodeTopBar() {
  const {
    gitStatus,
    branches,
    switchBranch,
    isGitLoading,
    gitPull,
    gitPush,
    collaborators,
    syncStatus,
    permission,
    setCommandPaletteOpen,
    setQuickOpenOpen,
    setGithubModalOpen,
    setPermissionsModalOpen,
    setSettingsModalOpen,
    setRunDebugModalOpen,
    setActiveActivityBarView,
  } = useCodeStore();

  const { currentProject } = useProjectStore();
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  const branch = gitStatus?.branch || "main";
  const ahead = gitStatus?.ahead || 0;
  const behind = gitStatus?.behind || 0;
  const collabCount = collaborators.length;

  return (
    <header className="h-[42px] px-3 bg-[#070a14] border-b border-white/[0.08] flex items-center justify-between select-none flex-shrink-0 z-30 text-xs">
      {/* ── Left Section: Brand, Project Name & Branch Selector ── */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* SprintForge Brand Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-violet-600/20 to-purple-600/10 border border-violet-500/25 text-violet-300 font-bold tracking-tight">
          <Code2 className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-sans text-[11px] font-semibold text-white tracking-wide">
            SprintForge
          </span>
        </div>

        <span className="text-slate-600 text-xs font-mono">/</span>

        {/* Project Name */}
        <span className="text-slate-300 font-medium text-xs truncate max-w-[140px] sm:max-w-[200px]" title={currentProject?.name}>
          {currentProject?.name || "Workspace"}
        </span>

        <span className="text-slate-600 text-xs font-mono">/</span>

        {/* Branch Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Switch Git Branch"
          >
            <GitBranch className="w-3 h-3 text-violet-400 flex-shrink-0" />
            <span className="font-mono text-[11px] font-semibold truncate max-w-[100px]">
              {branch}
            </span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
          </button>

          {branchDropdownOpen && (
            <div
              className="absolute top-full left-0 mt-1 z-50 w-52 bg-[#0c1024] border border-white/[0.12] rounded-xl shadow-2xl py-1 text-xs"
              onClick={() => setBranchDropdownOpen(false)}
            >
              <div className="px-3 py-1 text-[10px] font-mono uppercase text-slate-500 font-bold">
                Git Branches
              </div>
              {branches?.all?.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => switchBranch(b)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-left font-mono transition-colors",
                    b === branch
                      ? "text-violet-300 bg-violet-600/20 font-bold"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  <span className="truncate">{b}</span>
                  {b === branch && <Check className="w-3 h-3 text-violet-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sync Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Synced</span>
        </div>
      </div>

      {/* ── Center Section: Quick Search & Command Palette Trigger ── */}
      <div className="flex-1 max-w-md mx-3 hidden sm:flex items-center">
        <button
          type="button"
          onClick={() => setQuickOpenOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors text-xs cursor-pointer group"
          title="Search files across workspace (Ctrl+P)"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 transition-colors" />
            <span className="text-[11px] text-slate-400">
              Search files in {currentProject?.name || "workspace"}...
            </span>
          </div>
          <kbd className="hidden lg:inline px-1.5 py-0.2 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-slate-400">
            Ctrl+P
          </kbd>
        </button>
      </div>

      {/* ── Right Section: Run/Debug, Collabs, Settings & Actions ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Run Script */}
        <button
          type="button"
          onClick={() => setRunDebugModalOpen(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px] transition-colors cursor-pointer"
          title="Run project scripts (npm run dev, test, build)"
        >
          <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
          <span className="hidden md:inline">Run</span>
        </button>

        {/* Debug Script */}
        <button
          type="button"
          onClick={() => setRunDebugModalOpen(true)}
          className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white font-medium text-[11px] transition-colors cursor-pointer"
          title="Run & Debug"
        >
          <Bug className="w-3 h-3 text-amber-400" />
          <span>Debug</span>
        </button>

        <div className="h-4 w-px bg-white/[0.08] mx-1 hidden sm:block" />

        {/* Git Pull / Push Quick Controls */}
        <button
          type="button"
          onClick={() => gitPull()}
          disabled={isGitLoading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer disabled:opacity-40"
          title="Pull latest changes (Git Pull)"
        >
          <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
        </button>

        <button
          type="button"
          onClick={() => gitPush()}
          disabled={isGitLoading || permission !== "WRITE"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer disabled:opacity-40"
          title="Push commits (Git Push)"
        >
          <ArrowUp className="w-3.5 h-3.5 text-violet-400" />
        </button>

        {/* Live Collaborators Count */}
        <button
          type="button"
          onClick={() => setActiveActivityBarView("collab")}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 text-violet-200 text-xs font-semibold transition-colors cursor-pointer"
          title={`${collabCount} live collaborator${collabCount === 1 ? "" : "s"} in workspace`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Users className="w-3 h-3 text-violet-400" />
          <span>{collabCount}</span>
        </button>

        {/* Command Palette Button */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          title="Command Palette (Ctrl+Shift+P)"
        >
          <Command className="w-3.5 h-3.5" />
        </button>

        {/* IDE Settings */}
        <button
          type="button"
          onClick={() => setSettingsModalOpen(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          title="IDE & Editor Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
