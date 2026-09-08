"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Pin,
  PinOff,
  GitCompare,
  Search,
  Command,
  Terminal,
  MoreHorizontal,
} from "lucide-react";
import { useCodeStore, CodeTab } from "@/lib/store/codeStore";
import { getFileIcon } from "./FileTreeItem";
import { cn } from "@/lib/utils";

export function EditorTabs() {
  const {
    openTabs,
    activeTabId,
    setActiveTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    pinTab,
    gitStatus,
    activeDiff,
    loadGitDiff,
    setCommandPaletteOpen,
    setQuickOpenOpen,
    toggleTerminal,
    terminalOpen,
  } = useCodeStore();

  const [tabContextMenu, setTabContextMenu] = useState<{
    tab: CodeTab;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => setTabContextMenu(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const activeTab = openTabs.find((t) => t.id === activeTabId);
  const hasGitChanges = gitStatus?.files?.some((f) => f.path === activeTabId);

  return (
    <div className="h-10 bg-[#070a18] border-b border-white/[0.08] flex items-center justify-between px-2 select-none flex-shrink-0 z-10">
      {/* ── Horizontal Scrolling Tabs ── */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 min-w-0 flex-1">
        {openTabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          const ext = tab.path.split(".").pop();

          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTabContextMenu({ tab, x: e.clientX, y: e.clientY });
              }}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border flex-shrink-0 max-w-[200px]",
                isActive
                  ? "bg-[#0f142e] text-white border-white/[0.12] shadow-sm font-semibold"
                  : "bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border-transparent"
              )}
            >
              {/* Active Purple Bottom Bar */}
              {isActive && (
                <div className="absolute left-2 right-2 -bottom-[5px] h-[2px] bg-violet-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.9)]" />
              )}

              {/* Icon */}
              {getFileIcon(ext, tab.title)}

              {/* Title */}
              <span className="truncate">{tab.title}</span>

              {/* Pinned Icon */}
              {tab.isPinned && (
                <Pin className="w-3 h-3 text-violet-400 flex-shrink-0 rotate-45" />
              )}

              {/* Dirty / Close Indicator */}
              <div className="flex items-center ml-1">
                {tab.isDirty ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/[0.1] text-violet-400 hover:text-white"
                  >
                    <div className="w-2 h-2 rounded-full bg-violet-400 group-hover:hidden" />
                    <X className="w-3.5 h-3.5 hidden group-hover:block" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/[0.1] text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Right Action Shortcuts Bar ── */}
      <div className="flex items-center gap-1 pl-2 border-l border-white/[0.08] flex-shrink-0">
        {/* Diff View Toggle */}
        {hasGitChanges && (
          <button
            type="button"
            onClick={() => {
              if (activeDiff?.file === activeTabId) {
                useCodeStore.setState({ activeDiff: null });
              } else if (activeTabId) {
                loadGitDiff(activeTabId);
              }
            }}
            className={cn(
              "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer",
              activeDiff?.file === activeTabId && "text-violet-300 bg-violet-600/20 border border-violet-500/30"
            )}
            title="Toggle Git Diff for active file"
          >
            <GitCompare className="w-4 h-4" />
          </button>
        )}

        {/* Quick Open (Cmd+P) */}
        <button
          type="button"
          onClick={() => setQuickOpenOpen(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Quick Open File (Ctrl+P)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Command Palette (Cmd+Shift+P) */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Command Palette (Ctrl+Shift+P)"
        >
          <Command className="w-4 h-4" />
        </button>

        {/* Terminal Toggle */}
        <button
          type="button"
          onClick={() => toggleTerminal()}
          className={cn(
            "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer",
            terminalOpen && "text-violet-300 bg-violet-600/20 border border-violet-500/30"
          )}
          title="Toggle Terminal (Ctrl+`)"
        >
          <Terminal className="w-4 h-4" />
        </button>
      </div>

      {/* ── Tab Context Menu ── */}
      {tabContextMenu && (
        <div
          style={{ top: `${tabContextMenu.y}px`, left: `${tabContextMenu.x}px` }}
          className="fixed z-50 min-w-[150px] bg-[#0c1024] border border-white/[0.12] rounded-xl shadow-2xl py-1 text-xs text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              closeTab(tabContextMenu.tab.id);
              setTabContextMenu(null);
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-violet-600/20 hover:text-white transition-colors text-left"
          >
            <span>Close</span>
            <kbd className="text-[10px] text-slate-500 font-mono">Ctrl+W</kbd>
          </button>
          <button
            type="button"
            onClick={() => {
              closeOtherTabs(tabContextMenu.tab.id);
              setTabContextMenu(null);
            }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-violet-600/20 hover:text-white transition-colors text-left"
          >
            Close Others
          </button>
          <button
            type="button"
            onClick={() => {
              closeAllTabs();
              setTabContextMenu(null);
            }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-violet-600/20 hover:text-white transition-colors text-left"
          >
            Close All
          </button>
          <div className="h-px bg-white/[0.08] my-1" />
          <button
            type="button"
            onClick={() => {
              pinTab(tabContextMenu.tab.id);
              setTabContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-violet-600/20 hover:text-white transition-colors text-left"
          >
            {tabContextMenu.tab.isPinned ? (
              <>
                <PinOff className="w-3.5 h-3.5 text-slate-400" />
                Unpin Tab
              </>
            ) : (
              <>
                <Pin className="w-3.5 h-3.5 text-violet-400" />
                Pin Tab
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
