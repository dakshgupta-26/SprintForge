"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Command,
  Search,
  FilePlus,
  FolderPlus,
  GitBranch,
  GitCommit,
  ArrowUp,
  ArrowDown,
  Terminal,
  Save,
  RotateCw,
  X,
  FileCode,
  ArrowRight,
} from "lucide-react";
import { useCodeStore } from "@/lib/store/codeStore";
import { cn } from "@/lib/utils";

export function CodeCommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    saveActiveFile,
    toggleTerminal,
    setActiveActivityBarView,
    setQuickOpenOpen,
    setGithubModalOpen,
    setPermissionsModalOpen,
    gitPull,
    gitPush,
    loadFileTree,
    loadGitStatus,
    openTabs,
    closeTab,
    activeTabId,
    permission,
  } = useCodeStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [commandPaletteOpen]);

  // Global key listener for Ctrl+Shift+P / Cmd+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const commands: Array<{
    id: string;
    title: string;
    category: string;
    icon: React.ComponentType<any>;
    shortcut?: string;
    action: () => void;
  }> = [
    {
      id: "save-file",
      title: "File: Save Active File",
      category: "File",
      icon: Save,
      shortcut: "Ctrl+S",
      action: () => {
        saveActiveFile();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "quick-open",
      title: "File: Quick Open File...",
      category: "File",
      icon: Search,
      shortcut: "Ctrl+P",
      action: () => {
        setCommandPaletteOpen(false);
        setQuickOpenOpen(true);
      },
    },
    {
      id: "toggle-terminal",
      title: "View: Toggle Terminal",
      category: "View",
      icon: Terminal,
      shortcut: "Ctrl+`",
      action: () => {
        toggleTerminal();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "view-explorer",
      title: "View: Show File Explorer",
      category: "View",
      icon: FileCode,
      action: () => {
        setActiveActivityBarView("explorer");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "view-git",
      title: "View: Show Source Control",
      category: "View",
      icon: GitBranch,
      action: () => {
        setActiveActivityBarView("git");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "view-search",
      title: "View: Show Project Search",
      category: "View",
      icon: Search,
      action: () => {
        setActiveActivityBarView("search");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "git-pull",
      title: "Git: Pull Latest Changes",
      category: "Git",
      icon: ArrowDown,
      action: () => {
        gitPull();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "git-push",
      title: "Git: Push Commits to Origin",
      category: "Git",
      icon: ArrowUp,
      action: () => {
        gitPush();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "refresh-files",
      title: "Explorer: Refresh Files",
      category: "Explorer",
      icon: RotateCw,
      action: () => {
        loadFileTree();
        loadGitStatus();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "connect-github",
      title: "GitHub: Connect Repository...",
      category: "GitHub",
      icon: GitBranch,
      action: () => {
        setCommandPaletteOpen(false);
        setGithubModalOpen(true);
      },
    },
    {
      id: "manage-permissions",
      title: "Security: Manage Code Permissions...",
      category: "Security",
      icon: Command,
      action: () => {
        setCommandPaletteOpen(false);
        setPermissionsModalOpen(true);
      },
    },
  ];

  if (activeTabId) {
    commands.push({
      id: "close-active-tab",
      title: "View: Close Active Tab",
      category: "View",
      icon: X,
      shortcut: "Ctrl+W",
      action: () => {
        closeTab(activeTabId);
        setCommandPaletteOpen(false);
      },
    });
  }

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setCommandPaletteOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-[#090d20] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-white/[0.08] gap-3 bg-[#0a0e24]">
          <Command className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-white placeholder:text-slate-500 text-xs focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands found
            </div>
          ) : (
            filtered.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer text-xs",
                    isSelected
                      ? "bg-violet-600/20 border border-violet-500/40 text-white font-semibold"
                      : "text-slate-300 hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <span className="truncate">{cmd.title}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {cmd.shortcut && (
                      <kbd className="text-[10px] font-mono text-violet-300 bg-violet-500/15 border border-violet-500/30 px-1.5 py-0.5 rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {cmd.category}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
