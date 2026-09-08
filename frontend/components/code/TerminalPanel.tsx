"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  RotateCw,
  Trash2,
  Maximize2,
  Minimize2,
  AlertCircle,
  FileText,
  Bug,
  ChevronDown,
} from "lucide-react";
import { useCodeStore, BottomPanelTab } from "@/lib/store/codeStore";
import { getSocket } from "@/lib/socket";
import { ProblemsPanel } from "./ProblemsPanel";
import { cn } from "@/lib/utils";

export function TerminalPanel() {
  const {
    projectId,
    bottomPanelOpen,
    bottomPanelTab,
    setBottomPanelTab,
    toggleBottomPanel,
    terminalTabs,
    activeTerminalId,
    addTerminalTab,
    closeTerminalTab,
    setActiveTerminalTab,
    problems,
    outputLogs,
    clearOutputLogs,
    debugLogs,
    clearDebugLogs,
  } = useCodeStore();

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [panelHeight, setPanelHeight] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const errorCount = problems.filter((p) => p.severity === "error").length;
  const warningCount = problems.filter((p) => p.severity === "warning").length;

  // Initialize Terminal
  useEffect(() => {
    if (!bottomPanelOpen || bottomPanelTab !== "terminal" || !terminalContainerRef.current || !projectId) return;

    const xterm = new XTerm({
      cursorBlink: true,
      cursorStyle: "bar",
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
      theme: {
        background: "#050814",
        foreground: "#cbd5e1",
        cursor: "#a855f7",
        cursorAccent: "#050814",
        selectionBackground: "#8b5cf644",
        black: "#0f172a",
        red: "#f87171",
        green: "#34d399",
        yellow: "#fbbf24",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#38bdf8",
        white: "#f8fafc",
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    xterm.open(terminalContainerRef.current);
    try {
      fitAddon.fit();
    } catch {}

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("code:terminal:start", {
        projectId,
        sessionId: activeTerminalId,
      });

      const handleData = (data: { sessionId: string; data: string }) => {
        if (data.sessionId === activeTerminalId) {
          xterm.write(data.data);
        }
      };

      const dataListener = xterm.onData((input) => {
        socket.emit("code:terminal:input", {
          projectId,
          sessionId: activeTerminalId,
          data: input,
        });
      });

      socket.on("code:terminal:data", handleData);

      const handleResize = () => {
        try {
          fitAddon.fit();
        } catch {}
      };

      window.addEventListener("resize", handleResize);

      return () => {
        dataListener.dispose();
        socket.off("code:terminal:data", handleData);
        window.removeEventListener("resize", handleResize);
        xterm.dispose();
      };
    }
  }, [bottomPanelOpen, bottomPanelTab, activeTerminalId, projectId]);

  // Refit when height / maximize state changes
  useEffect(() => {
    if (fitAddonRef.current && bottomPanelOpen && bottomPanelTab === "terminal") {
      const timer = setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
        } catch {}
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isMaximized, panelHeight, bottomPanelOpen, bottomPanelTab]);

  // Handle Drag Resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startY = e.clientY;
    const startHeight = panelHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      const newHeight = Math.max(140, Math.min(600, startHeight + delta));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (!bottomPanelOpen) return null;

  const handleClearTerminal = () => {
    xtermRef.current?.clear();
  };

  const handleRestartTerminal = () => {
    const socket = getSocket();
    if (socket?.connected && projectId) {
      xtermRef.current?.clear();
      socket.emit("code:terminal:start", {
        projectId,
        sessionId: activeTerminalId,
      });
    }
  };

  return (
    <div
      style={{ height: isMaximized ? "75vh" : `${panelHeight}px` }}
      className="bg-[#050814] border-t border-white/[0.08] flex flex-col select-none flex-shrink-0 z-20 transition-[height] duration-75 relative"
    >
      {/* ── Top Drag Resize Handle ── */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "h-1 w-full cursor-row-resize hover:bg-violet-500/80 transition-colors absolute -top-0.5 left-0 right-0 z-30",
          isResizing && "bg-violet-500"
        )}
      />

      {/* ── Bottom Panel Tab Header ── */}
      <div className="h-8 px-2 bg-[#070a18] border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 text-xs">
        {/* Left Tabs: Problems, Output, Terminal, Debug */}
        <div className="flex items-center gap-1 min-w-0">
          {/* Problems Tab */}
          <button
            type="button"
            onClick={() => setBottomPanelTab("problems")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer",
              bottomPanelTab === "problems"
                ? "bg-violet-600/20 text-white font-bold border border-violet-500/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            <AlertCircle className="w-3.5 h-3.5 text-violet-400" />
            <span>PROBLEMS</span>
            {problems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                {problems.length}
              </span>
            )}
          </button>

          {/* Output Tab */}
          <button
            type="button"
            onClick={() => setBottomPanelTab("output")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer",
              bottomPanelTab === "output"
                ? "bg-violet-600/20 text-white font-bold border border-violet-500/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>OUTPUT</span>
          </button>

          {/* Terminal Tab */}
          <button
            type="button"
            onClick={() => setBottomPanelTab("terminal")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer",
              bottomPanelTab === "terminal"
                ? "bg-violet-600/20 text-white font-bold border border-violet-500/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>TERMINAL</span>
          </button>

          {/* Debug Console Tab */}
          <button
            type="button"
            onClick={() => setBottomPanelTab("debug")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer",
              bottomPanelTab === "debug"
                ? "bg-violet-600/20 text-white font-bold border border-violet-500/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Bug className="w-3.5 h-3.5 text-amber-400" />
            <span>DEBUG CONSOLE</span>
          </button>

          {/* Terminal Multi-Tabs (when on Terminal tab) */}
          {bottomPanelTab === "terminal" && (
            <div className="flex items-center gap-1 pl-2 ml-2 border-l border-white/[0.08]">
              {terminalTabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTerminalTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors",
                    tab.id === activeTerminalId
                      ? "bg-white/[0.06] text-violet-300 font-bold"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <span>{tab.title}</span>
                  {terminalTabs.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTerminalTab(tab.id);
                      }}
                      className="p-0.5 hover:bg-white/[0.1] rounded text-slate-400 hover:text-white"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => addTerminalTab()}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="New Terminal"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right Actions Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {bottomPanelTab === "terminal" && (
            <>
              <button
                type="button"
                onClick={handleClearTerminal}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Clear Terminal (Ctrl+L)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRestartTerminal}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Restart Session"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {bottomPanelTab === "output" && (
            <button
              type="button"
              onClick={clearOutputLogs}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Clear Output"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {bottomPanelTab === "debug" && (
            <button
              type="button"
              onClick={clearDebugLogs}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Clear Debug Console"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title={isMaximized ? "Restore Height" : "Maximize Panel"}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => toggleBottomPanel(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tab Views Body ── */}
      <div className="flex-1 w-full h-full overflow-hidden bg-[#050814] relative">
        {/* 1. Terminal View */}
        <div
          className={cn(
            "w-full h-full p-2",
            bottomPanelTab !== "terminal" && "hidden"
          )}
          ref={terminalContainerRef}
        />

        {/* 2. Problems View */}
        {bottomPanelTab === "problems" && <ProblemsPanel />}

        {/* 3. Output View */}
        {bottomPanelTab === "output" && (
          <div className="w-full h-full p-3 overflow-y-auto font-mono text-xs text-slate-300 space-y-1 scrollbar-thin select-text">
            {outputLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        )}

        {/* 4. Debug Console View */}
        {bottomPanelTab === "debug" && (
          <div className="w-full h-full p-3 overflow-y-auto font-mono text-xs text-slate-300 space-y-1 scrollbar-thin select-text">
            {debugLogs.length === 0 ? (
              <p className="text-slate-600 italic">No debug output yet. Run a debug script to see session traces.</p>
            ) : (
              debugLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed text-amber-300/90">
                  {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
