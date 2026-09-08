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
  ChevronDown,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useCodeStore } from "@/lib/store/codeStore";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

export function TerminalPanel() {
  const {
    projectId,
    terminalOpen,
    toggleTerminal,
    terminalTabs,
    activeTerminalId,
    addTerminalTab,
    closeTerminalTab,
    setActiveTerminalTab,
  } = useCodeStore();

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!terminalOpen || !terminalContainerRef.current || !projectId) return;

    // Initialize XTerm instance
    const xterm = new XTerm({
      cursorBlink: true,
      cursorStyle: "bar",
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
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
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    const socket = getSocket();
    if (socket?.connected) {
      // Start terminal session on backend
      socket.emit("code:terminal:start", {
        projectId,
        sessionId: activeTerminalId,
      });

      // Handle incoming data
      const handleData = (data: { sessionId: string; data: string }) => {
        if (data.sessionId === activeTerminalId) {
          xterm.write(data.data);
        }
      };

      // Handle user typing input
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
  }, [terminalOpen, activeTerminalId, projectId]);

  // Refit when terminal height/maximize changes
  useEffect(() => {
    if (fitAddonRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
        } catch {}
      }, 100);
    }
  }, [isMaximized, terminalOpen]);

  if (!terminalOpen) return null;

  const handleClear = () => {
    xtermRef.current?.clear();
  };

  const handleRestart = () => {
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
      className={cn(
        "bg-[#050814] border-t border-white/[0.08] flex flex-col select-none transition-all duration-200 z-20",
        isMaximized ? "h-[65vh]" : "h-56 sm:h-64"
      )}
    >
      {/* ── Terminal Header Bar ── */}
      <div className="h-9 px-3 bg-[#080c1e] border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 text-xs">
        {/* Terminal Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0">
          <div className="flex items-center gap-1.5 text-slate-400 mr-2">
            <TerminalIcon className="w-4 h-4 text-violet-400" />
            <span className="font-mono font-bold uppercase text-[10px] text-slate-400">
              Terminal
            </span>
          </div>

          {terminalTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTerminalTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors border",
                tab.id === activeTerminalId
                  ? "bg-violet-600/20 text-white border-violet-500/30 font-semibold"
                  : "bg-white/[0.02] text-slate-400 hover:text-white border-transparent"
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
                  className="p-0.5 rounded hover:bg-white/[0.1] text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => addTerminalTab()}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors ml-1"
            title="New Terminal Tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRestart}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Restart Session"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title={isMaximized ? "Restore Height" : "Maximize Height"}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => toggleTerminal(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Close Terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Xterm Container ── */}
      <div className="flex-1 w-full h-full p-2 overflow-hidden bg-[#050814]" ref={terminalContainerRef} />
    </div>
  );
}
