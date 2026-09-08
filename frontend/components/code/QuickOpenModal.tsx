"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useCodeStore, FileTreeItem } from "@/lib/store/codeStore";
import { getFileIcon } from "./FileTreeItem";
import { cn } from "@/lib/utils";

export function QuickOpenModal() {
  const { quickOpenOpen, setQuickOpenOpen, fileTree, openFile } = useCodeStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quickOpenOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [quickOpenOpen]);

  // Global key listener for Ctrl+P / Cmd+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setQuickOpenOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setQuickOpenOpen]);

  // Flatten all files from recursive tree
  const allFiles = useMemo(() => {
    const files: Array<{ path: string; name: string; extension?: string }> = [];

    const extract = (items: FileTreeItem[]) => {
      for (const item of items) {
        if (item.type === "file") {
          files.push({
            path: item.path,
            name: item.name,
            extension: item.extension,
          });
        }
        if (item.children) {
          extract(item.children);
        }
      }
    };

    extract(fileTree);
    return files;
  }, [fileTree]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allFiles;
    const q = query.toLowerCase().trim();
    return allFiles.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    );
  }, [allFiles, query]);

  if (!quickOpenOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuickOpenOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        openFile(filtered[selectedIndex].path);
        setQuickOpenOpen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-[#090d20] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-white/[0.08] gap-3 bg-[#0a0e24]">
          <Search className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search files by name (e.g. index.ts, Button.tsx)..."
            className="w-full bg-transparent text-white placeholder:text-slate-500 text-xs focus:outline-none font-mono"
          />
          <kbd className="text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No files found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((file, index) => {
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => {
                    openFile(file.path);
                    setQuickOpenOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer text-xs",
                    isSelected
                      ? "bg-violet-600/20 border border-violet-500/40 text-white font-semibold"
                      : "text-slate-300 hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getFileIcon(file.extension, file.name)}
                    <span className="truncate font-mono font-medium">{file.name}</span>
                    <span className="text-[11px] text-slate-500 truncate font-mono">
                      {file.path}
                    </span>
                  </div>

                  {isSelected && (
                    <ArrowRight className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
