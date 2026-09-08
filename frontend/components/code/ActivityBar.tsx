"use client";

import React from "react";
import {
  Files,
  GitBranch,
  Search,
  Users,
  History,
  Settings,
  ShieldCheck,
  Terminal,
  PlayCircle,
  AlertCircle,
} from "lucide-react";
import { GitHubIcon } from "@/components/shared/GitHubIcon";
import { useCodeStore, ActivityBarView } from "@/lib/store/codeStore";
import { cn } from "@/lib/utils";

export function ActivityBar() {
  const {
    activeActivityBarView,
    setActiveActivityBarView,
    gitStatus,
    collaborators,
    problems,
    terminalOpen,
    toggleTerminal,
    setGithubModalOpen,
    setPermissionsModalOpen,
    setSettingsModalOpen,
    permission,
  } = useCodeStore();

  const changedCount = gitStatus?.files?.length || 0;
  const collabCount = collaborators.length;
  const errorCount = problems.filter((p) => p.severity === "error").length;

  const navButtons: Array<{
    id: ActivityBarView;
    label: string;
    icon: React.ComponentType<any>;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: "explorer",
      label: "Explorer (Ctrl+Shift+E)",
      icon: Files,
    },
    {
      id: "git",
      label: "Source Control (Ctrl+Shift+G)",
      icon: GitBranch,
      badge: changedCount > 0 ? changedCount : undefined,
      badgeColor: "bg-violet-600",
    },
    {
      id: "search",
      label: "Search across Files (Ctrl+Shift+F)",
      icon: Search,
    },
    {
      id: "problems",
      label: "Problems & Diagnostics",
      icon: AlertCircle,
      badge: errorCount > 0 ? errorCount : undefined,
      badgeColor: "bg-rose-600",
    },
    {
      id: "debug",
      label: "Run & Debug Configurations",
      icon: PlayCircle,
    },
    {
      id: "collab",
      label: "Live Collaborators",
      icon: Users,
      badge: collabCount > 1 ? collabCount : undefined,
      badgeColor: "bg-emerald-600",
    },
    {
      id: "activity",
      label: "Code History & Audit Log",
      icon: History,
    },
  ];

  return (
    <aside className="w-12 bg-[#070a14] border-r border-white/[0.08] flex flex-col items-center justify-between py-2 select-none flex-shrink-0 z-20">
      {/* ── Top Views Navigation ── */}
      <div className="flex flex-col items-center gap-1 w-full">
        {navButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeActivityBarView === btn.id;

          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setActiveActivityBarView(btn.id)}
              className={cn(
                "relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer group",
                isActive
                  ? "text-violet-300 bg-violet-600/20 border border-violet-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
              )}
              title={btn.label}
            >
              {/* Active Purple Left Indicator Line */}
              {isActive && (
                <div className="absolute -left-1 top-1.5 bottom-1.5 w-1 bg-violet-500 rounded-r shadow-[0_0_8px_rgba(139,92,246,0.9)]" />
              )}

              <Icon
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-105",
                  isActive ? "text-violet-400" : "text-slate-400 group-hover:text-slate-200"
                )}
              />

              {btn.badge !== undefined && (
                <span
                  className={cn(
                    "absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full border border-[#070a14] text-[9px] font-mono font-bold text-white flex items-center justify-center shadow-md",
                    btn.badgeColor || "bg-violet-600"
                  )}
                >
                  {btn.badge > 9 ? "9+" : btn.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Bottom Tools Controls ── */}
      <div className="flex flex-col items-center gap-1 w-full pt-2 border-t border-white/[0.06]">
        {/* Terminal Toggle */}
        <button
          type="button"
          onClick={() => toggleTerminal()}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
            terminalOpen
              ? "text-violet-300 bg-violet-600/20 border border-violet-500/30"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          )}
          title="Toggle Integrated Terminal (Ctrl+`)"
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* GitHub Integration Modal */}
        <button
          type="button"
          onClick={() => setGithubModalOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
          title="Connect GitHub Repository"
        >
          <GitHubIcon className="w-4 h-4" />
        </button>

        {/* Permissions Modal */}
        <button
          type="button"
          onClick={() => setPermissionsModalOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
          title={`Code Permissions (${permission})`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Settings Modal */}
        <button
          type="button"
          onClick={() => setSettingsModalOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
          title="IDE & Editor Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
