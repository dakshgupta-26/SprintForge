"use client";

import React, { useState } from "react";
import {
  Play,
  Bug,
  Terminal,
  RotateCw,
  StopCircle,
  Sparkles,
  Command,
  Package,
  Layers,
  Cpu,
} from "lucide-react";
import { useCodeStore } from "@/lib/store/codeStore";
import { getSocket } from "@/lib/socket";

export function RunDebugPanel() {
  const {
    projectId,
    activeTabId,
    toggleTerminal,
    activeTerminalId,
    addOutputLog,
    permission,
  } = useCodeStore();

  const [customCommand, setCustomCommand] = useState("");

  const getSmartRunner = (cmd: string): string => {
    const trimmed = cmd.trim();
    // Prevent permission denied on ./script.js or script.js
    const jsMatch = trimmed.match(/^\.?\/?([^\s]+\.(js|mjs|cjs))$/i);
    if (jsMatch) return `node ${jsMatch[1]}`;

    const tsMatch = trimmed.match(/^\.?\/?([^\s]+\.(ts|mts|cts|tsx))$/i);
    if (tsMatch) return `npx tsx ${tsMatch[1]}`;

    const pyMatch = trimmed.match(/^\.?\/?([^\s]+\.py)$/i);
    if (pyMatch) return `python ${pyMatch[1]}`;

    const javaMatch = trimmed.match(/^\.?\/?([^\s]+)\.java$/i);
    if (javaMatch) return `javac ${trimmed} && java ${javaMatch[1]}`;

    const cMatch = trimmed.match(/^\.?\/?([^\s]+\.c)$/i);
    if (cMatch) return `gcc ${cMatch[1]} -o a.out && ./a.out`;

    const cppMatch = trimmed.match(/^\.?\/?([^\s]+\.(cpp|cc))$/i);
    if (cppMatch) return `g++ ${cppMatch[1]} -o a.out && ./a.out`;

    return trimmed;
  };

  const standardScripts = [
    {
      id: "dev",
      name: "npm run dev",
      label: "Start Development Server",
      description: "Launches the local hot-reloading dev server",
      icon: Play,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
    },
    {
      id: "test",
      name: "npm test",
      label: "Run Test Suite",
      description: "Executes unit and integration test runners",
      icon: Bug,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "build",
      name: "npm run build",
      label: "Production Build",
      description: "Compiles production bundle and type-checks",
      icon: Layers,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/30",
    },
    {
      id: "lint",
      name: "npm run lint",
      label: "Run ESLint",
      description: "Validates code style and rules",
      icon: Cpu,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/30",
    },
  ];

  const handleRunCommand = (rawCmd: string) => {
    if (!projectId) return;

    const cmd = getSmartRunner(rawCmd);
    toggleTerminal(true);
    addOutputLog(`[Process] Executing: ${cmd}`);

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("code:terminal:input", {
        projectId,
        sessionId: activeTerminalId,
        data: `${cmd}\r`,
      });
    }
  };

  const activeFileRunner = activeTabId ? getSmartRunner(activeTabId) : null;

  return (
    <div className="h-full flex flex-col bg-[#070a18] select-none text-slate-300 text-xs">
      {/* ── Header ── */}
      <div className="h-10 px-3 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#070a18]">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-400" />
          <span className="font-mono font-bold uppercase tracking-wider text-slate-300">
            Run & Debug
          </span>
        </div>
      </div>

      {/* ── Scripts List ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {/* Active File Runner Card */}
        {activeTabId && activeFileRunner && activeFileRunner !== activeTabId && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400">
                Active Source File
              </span>
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                {activeTabId}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-white font-semibold truncate flex-1">
                {activeFileRunner}
              </code>
              <button
                type="button"
                onClick={() => handleRunCommand(activeFileRunner)}
                disabled={permission === "VIEW"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 flex-shrink-0 shadow-sm"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Run File</span>
              </button>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-[10px] font-mono uppercase font-bold text-slate-500 mb-2">
            Project Scripts
          </h4>
          <div className="space-y-2">
            {standardScripts.map((script) => {
              const Icon = script.icon;
              return (
                <div
                  key={script.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">
                        {script.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {script.label}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRunCommand(script.name)}
                    disabled={permission === "VIEW"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-40"
                    title={`Run ${script.name}`}
                  >
                    <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                    <span>Run</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Custom Command Execution ── */}
        <div className="pt-2 border-t border-white/[0.06] space-y-2">
          <h4 className="text-[10px] font-mono uppercase font-bold text-slate-500">
            Execute Command
          </h4>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customCommand.trim()) {
                  handleRunCommand(customCommand.trim());
                  setCustomCommand("");
                }
              }}
              placeholder="e.g. npx tsc --noEmit"
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 font-mono"
            />
            <button
              type="button"
              onClick={() => {
                if (customCommand.trim()) {
                  handleRunCommand(customCommand.trim());
                  setCustomCommand("");
                }
              }}
              disabled={!customCommand.trim() || permission === "VIEW"}
              className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-40"
            >
              Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
