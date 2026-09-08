"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCode,
  Filter,
} from "lucide-react";
import { useCodeStore, CodeProblem } from "@/lib/store/codeStore";
import { cn } from "@/lib/utils";

export function ProblemsPanel() {
  const { problems, openFile } = useCodeStore();
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const errors = problems.filter((p) => p.severity === "error");
  const warnings = problems.filter((p) => p.severity === "warning");
  const infos = problems.filter((p) => p.severity === "info");

  const filtered = problems.filter((p) => {
    if (filterSeverity === "all") return true;
    return p.severity === filterSeverity;
  });

  const handleJumpToProblem = (p: CodeProblem) => {
    openFile(p.file, { line: p.startLineNumber, column: p.startColumn });
  };

  return (
    <div className="h-full flex flex-col bg-[#070a18] select-none text-slate-300 text-xs">
      {/* ── Header ── */}
      <div className="h-9 px-3 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#070a18]">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-violet-400" />
          <span className="font-mono font-bold uppercase text-[11px] text-slate-300">
            Problems & Diagnostics
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/[0.06] text-[10px] font-mono text-slate-400">
            {problems.length}
          </span>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setFilterSeverity("all")}
            className={cn(
              "px-1.5 py-0.5 rounded cursor-pointer transition-colors",
              filterSeverity === "all"
                ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                : "text-slate-400 hover:text-white"
            )}
          >
            All ({problems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity("error")}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors",
              filterSeverity === "error"
                ? "bg-rose-600/30 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:text-white"
            )}
          >
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>{errors.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity("warning")}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors",
              filterSeverity === "warning"
                ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-white"
            )}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>{warnings.length}</span>
          </button>
        </div>
      </div>

      {/* ── Problem Items List ── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-400/60 mx-auto" />
            <p>No problems detected in workspace</p>
          </div>
        ) : (
          filtered.map((prob) => (
            <div
              key={prob.id}
              onClick={() => handleJumpToProblem(prob)}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/40 hover:bg-white/[0.04] transition-colors cursor-pointer space-y-1 group"
            >
              <div className="flex items-start gap-2">
                {prob.severity === "error" && (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                {prob.severity === "warning" && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                {prob.severity === "info" && (
                  <Info className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-slate-200 text-xs font-sans group-hover:text-white leading-relaxed">
                    {prob.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                    <span className="text-violet-400 flex items-center gap-1 truncate">
                      <FileCode className="w-3 h-3 flex-shrink-0" />
                      {prob.file}
                    </span>
                    <span>
                      [{prob.startLineNumber}, {prob.startColumn}]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
