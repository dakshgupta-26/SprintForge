"use client";

import React, { useState } from "react";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCw,
  Plus,
  GitCompare,
  FileCode,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useCodeStore } from "@/lib/store/codeStore";
import { getFileIcon } from "./FileTreeItem";
import { cn } from "@/lib/utils";

export function SourceControlPanel() {
  const {
    gitStatus,
    branches,
    loadGitStatus,
    loadGitDiff,
    commitChanges,
    switchBranch,
    gitPull,
    gitPush,
    isGitLoading,
    permission,
    openFile,
  } = useCodeStore();

  const [commitMessage, setCommitMessage] = useState("");
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [newBranchModalOpen, setNewBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  const changedFiles = gitStatus?.files || [];
  const canCommit = permission === "WRITE" && commitMessage.trim().length > 0 && changedFiles.length > 0;
  const canPush = permission === "WRITE";

  const handleCommit = async () => {
    if (!canCommit || isGitLoading) return;
    const ok = await commitChanges(commitMessage.trim());
    if (ok) {
      setCommitMessage("");
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || isGitLoading) return;
    const ok = await switchBranch(newBranchName.trim(), true);
    if (ok) {
      setNewBranchModalOpen(false);
      setNewBranchName("");
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#070a18] select-none text-slate-300">
      {/* ── Top Header Bar ── */}
      <div className="h-10 px-3 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#070a18]">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Source Control
          </span>
        </div>

        <button
          type="button"
          onClick={() => loadGitStatus()}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Refresh Git Status"
        >
          <RotateCw className={cn("w-3.5 h-3.5", isGitLoading && "animate-spin text-violet-400")} />
        </button>
      </div>

      {/* ── Branch & Remote Toolbar ── */}
      <div className="p-2.5 border-b border-white/[0.08] space-y-2 bg-[#090d20]">
        {/* Branch Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <GitBranch className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <span className="truncate font-mono">{gitStatus?.branch || "main"}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#0c1024] border border-white/[0.12] rounded-xl shadow-2xl py-1 text-xs">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-slate-500 font-bold">
                Branches
              </div>
              {branches?.all?.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    switchBranch(b);
                    setBranchDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors font-mono",
                    b === gitStatus?.branch
                      ? "text-violet-300 bg-violet-600/20 font-bold"
                      : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  <span className="truncate">{b}</span>
                  {b === gitStatus?.branch && <Check className="w-3 h-3 text-violet-400" />}
                </button>
              ))}

              {permission === "WRITE" && (
                <>
                  <div className="h-px bg-white/[0.08] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setBranchDropdownOpen(false);
                      setNewBranchModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-violet-400 hover:bg-violet-600/20 hover:text-violet-300 transition-colors text-left"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Branch...</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sync Controls (Pull & Push) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => gitPull()}
            disabled={isGitLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Pull changes from origin"
          >
            <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
            <span>Pull</span>
            {gitStatus?.behind !== undefined && gitStatus.behind > 0 && (
              <span className="text-[10px] font-mono text-blue-300">({gitStatus.behind})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => gitPush()}
            disabled={!canPush || isGitLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-xs font-semibold text-violet-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Push changes to origin"
          >
            <ArrowUp className="w-3.5 h-3.5 text-violet-400" />
            <span>Push</span>
            {gitStatus?.ahead !== undefined && gitStatus.ahead > 0 && (
              <span className="text-[10px] font-mono text-violet-300">({gitStatus.ahead})</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Commit Message Box ── */}
      {permission === "WRITE" && (
        <div className="p-2.5 border-b border-white/[0.08] space-y-2 bg-[#070a18]">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                handleCommit();
              }
            }}
            placeholder="Commit message (Ctrl+Enter to commit)..."
            rows={3}
            className="w-full px-2.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-violet-500 placeholder:text-slate-500 resize-none font-sans"
          />

          <button
            type="button"
            onClick={handleCommit}
            disabled={!canCommit || isGitLoading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGitLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GitCommit className="w-4 h-4" />
            )}
            <span>Commit Changes</span>
          </button>
        </div>
      )}

      {/* ── Changed Files List ── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono font-bold uppercase text-slate-400">
          <span>Changes ({changedFiles.length})</span>
        </div>

        {changedFiles.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            <Check className="w-5 h-5 text-emerald-400/60 mx-auto mb-1" />
            <p>Working tree is clean</p>
          </div>
        ) : (
          changedFiles.map((file) => {
            const fileName = file.path.split("/").pop() || file.path;
            const ext = fileName.split(".").pop();

            return (
              <div
                key={file.path}
                onClick={() => {
                  openFile(file.path);
                  loadGitDiff(file.path);
                }}
                className="group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-white/[0.04] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getFileIcon(ext, fileName)}
                  <span className="truncate text-slate-200 group-hover:text-white font-medium">
                    {file.path}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className={cn(
                      "text-[10px] font-mono font-bold px-1.5 py-0.2 rounded",
                      file.status === "M" && "text-amber-400 bg-amber-500/10",
                      file.status === "A" && "text-emerald-400 bg-emerald-500/10",
                      file.status === "D" && "text-rose-400 bg-rose-500/10",
                      file.status === "U" && "text-teal-400 bg-teal-500/10"
                    )}
                  >
                    {file.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Create Branch Modal ── */}
      {newBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0a0e22] border border-white/[0.12] rounded-2xl shadow-2xl p-4 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-200">
              Create New Branch
            </h4>
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateBranch();
                if (e.key === "Escape") setNewBranchModalOpen(false);
              }}
              placeholder="feature/branch-name"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewBranchModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateBranch}
                className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
              >
                Create & Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
