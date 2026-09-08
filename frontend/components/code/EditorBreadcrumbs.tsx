"use client";

import React, { useMemo } from "react";
import {
  ChevronRight,
  Copy,
  Check,
  Lock,
  Users,
  Loader2,
  FileCode,
} from "lucide-react";
import { useCodeStore } from "@/lib/store/codeStore";
import { getFileIcon } from "./FileTreeItem";
import { toast } from "react-hot-toast";

export function EditorBreadcrumbs() {
  const {
    activeTabId,
    openTabs,
    permission,
    collaborators,
    isSaving,
    openFile,
  } = useCodeStore();

  const [copied, setCopied] = React.useState(false);

  const activeTab = useMemo(
    () => openTabs.find((t) => t.id === activeTabId),
    [openTabs, activeTabId]
  );

  const breadcrumbSegments = useMemo(() => {
    if (!activeTabId) return [];
    return activeTabId.split("/");
  }, [activeTabId]);

  const activeFileCollabs = useMemo(() => {
    if (!activeTabId) return [];
    return collaborators.filter((c) => c.activeFile === activeTabId);
  }, [collaborators, activeTabId]);

  if (!activeTabId) return null;

  const ext = activeTabId.split(".").pop();
  const fileName = breadcrumbSegments[breadcrumbSegments.length - 1];
  const isReadOnly = permission === "VIEW";

  const handleCopyPath = () => {
    navigator.clipboard.writeText(activeTabId);
    setCopied(true);
    toast.success(`Copied path: ${activeTabId}`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-7 px-3 bg-[#070a18] border-b border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400 flex-shrink-0 z-10 select-none">
      {/* ── Path Segments ── */}
      <div className="flex items-center gap-1.5 min-w-0">
        {getFileIcon(ext, fileName)}
        <div className="flex items-center gap-1 overflow-hidden truncate">
          {breadcrumbSegments.map((segment, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
              <span
                className={
                  idx === breadcrumbSegments.length - 1
                    ? "text-slate-200 font-semibold"
                    : "text-slate-500 hover:text-slate-300 transition-colors"
                }
              >
                {segment}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Right Actions & Indicators ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Read Only Mode Badge */}
        {isReadOnly && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-sans font-medium">
            <Lock className="w-2.5 h-2.5" />
            <span>Read Only</span>
          </div>
        )}

        {/* Live File Collaborators */}
        {activeFileCollabs.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-200 text-[10px] font-sans font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Users className="w-3 h-3 text-violet-400" />
            <span>
              {activeFileCollabs.length} peer{activeFileCollabs.length === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {/* Saving Status Indicator */}
        {isSaving && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-violet-400" />
            <span>Saving...</span>
          </div>
        )}

        {/* Copy Relative Path Button */}
        <button
          type="button"
          onClick={handleCopyPath}
          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
          title="Copy Relative Path"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
}
