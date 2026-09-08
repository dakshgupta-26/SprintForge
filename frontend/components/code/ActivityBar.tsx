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
    terminalOpen,
    toggleTerminal,
    setGithubModalOpen,
    setPermissionsModalOpen,
    permission,
  } = useCodeStore();

  const changedCount = gitStatus?.files?.length || 0;
  const collabCount = collaborators.length;

  const navButtons: Array<{
    id: ActivityBarView;
    label: string;
    icon: React.ComponentType<any>;
    badge?: number;
    shortcut?: string;
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
    },
    {
      id: "search",
      label: "Search (Ctrl+Shift+F)",
      icon: Search,
    },
    {
      id: "collab",
      label: "Live Collaborators",
      icon: Users,
      badge: collabCount > 1 ? collabCount : undefined,
    },
    {
      id: "activity",
      label: "Code Activity & Audit",
      icon: History,
    },
  ];

  return (
    <div className="w-12 bg-[#090d1f] border-r border-white/[0.08] flex flex-col items-center justify-between py-2.5 select-none flex-shrink-0 z-20">
      {/* Top Navigation Views */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {navButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeActivityBarView === btn.id;

          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setActiveActivityBarView(btn.id)}
              className={cn(
                "relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer group",
                isActive
                  ? "text-violet-300 bg-violet-600/20 border border-violet-500/30"
                  : "hover:bg-white/[0.04]"
              )}
              title={btn.label}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-violet-500 rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
              )}
              <Icon className={cn("w-5 h-5", isActive ? "text-violet-400" : "text-slate-400 group-hover:text-slate-200")} />

              {btn.badge !== undefined && (
                <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-violet-600 border border-[#090d1f] text-[9px] font-mono font-bold text-white flex items-center justify-center">
                  {btn.badge > 9 ? "9+" : btn.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center gap-1.5 w-full pt-2 border-t border-white/[0.06]">
        {/* Terminal Toggle */}
        <button
          type="button"
          onClick={() => toggleTerminal()}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer",
            terminalOpen
              ? "text-violet-300 bg-violet-600/20 border border-violet-500/30"
              : "hover:bg-white/[0.04]"
          )}
          title="Toggle Terminal (Ctrl+`)"
        >
          <Terminal className="w-5 h-5" />
        </button>

        {/* GitHub Integration Modal */}
        <button
          type="button"
          onClick={() => setGithubModalOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
          title="Connect GitHub Repository"
        >
          <GitHubIcon className="w-5 h-5" />
        </button>

        {/* Permissions Modal */}
        <button
          type="button"
          onClick={() => setPermissionsModalOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer relative"
          title={`Code Permissions (${permission})`}
        >
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </button>
      </div>
    </div>
  );
}
