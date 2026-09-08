"use client";

import React, { useState } from "react";
import { Search, RotateCw, FileCode, ArrowRight, Loader2 } from "lucide-react";
import { useCodeStore } from "@/lib/store/codeStore";
import { getFileIcon } from "./FileTreeItem";
import { cn } from "@/lib/utils";

export function SearchPanel() {
  const {
    searchQuery,
    searchResults,
    isSearching,
    performSearch,
    openFile,
  } = useCodeStore();

  const [query, setQuery] = useState(searchQuery);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [isRegex, setIsRegex] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    performSearch(query, caseSensitive, isRegex);
  };

  const handleOpenResult = (res: any) => {
    openFile(res.file, { line: res.line, column: res.column });
  };

  return (
    <div className="h-full flex flex-col bg-[#070a18] select-none text-slate-300 text-xs">
      {/* ── Header ── */}
      <div className="h-9 px-3 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#070a18]">
        <div className="flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-mono font-bold uppercase text-[11px] text-slate-300">
            Search in Files
          </span>
        </div>
      </div>

      {/* ── Search Input Box ── */}
      <form onSubmit={handleSearch} className="p-2.5 border-b border-white/[0.08] space-y-2 bg-[#080c1e]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all files..."
            className="w-full pl-2.5 pr-14 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 font-mono"
          />

          <div className="absolute right-1 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setCaseSensitive(!caseSensitive)}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer",
                caseSensitive
                  ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                  : "text-slate-400 hover:text-white"
              )}
              title="Match Case (Aa)"
            >
              Aa
            </button>
            <button
              type="button"
              onClick={() => setIsRegex(!isRegex)}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer",
                isRegex
                  ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                  : "text-slate-400 hover:text-white"
              )}
              title="Use Regular Expression (.*)"
            >
              .*
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-40"
        >
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span>Search Workspace</span>
        </button>
      </form>

      {/* ── Search Results ── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
        <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-slate-400">
          <span>Matches ({searchResults.length})</span>
        </div>

        {searchResults.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            {query.trim() ? "No matches found" : "Enter a search term above"}
          </div>
        ) : (
          searchResults.map((res, index) => {
            const fileName = res.file.split("/").pop() || res.file;
            const ext = fileName.split(".").pop();

            return (
              <div
                key={`${res.file}-${res.line}-${index}`}
                onClick={() => handleOpenResult(res)}
                className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/30 hover:bg-white/[0.04] cursor-pointer transition-colors space-y-1 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getFileIcon(ext, fileName)}
                    <span className="font-semibold text-white truncate font-mono text-[11px] group-hover:text-violet-300">
                      {res.file}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                    Ln {res.line}, Col {res.column}
                  </span>
                </div>

                <p className="text-[11px] font-mono text-slate-300 bg-black/30 p-1.5 rounded truncate border border-white/[0.04]">
                  {res.preview}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
