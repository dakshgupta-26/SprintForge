"use client";

import React, { useState } from "react";
import { DiffEditor as MonacoDiffEditor } from "@monaco-editor/react";
import { useCodeStore, getLanguageFromPath } from "@/lib/store/codeStore";
import { X, Split, AlignJustify, GitCompare, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function DiffEditor() {
  const { activeDiff, openTabs, activeTabId, ideSettings } = useCodeStore();
  const [inlineView, setInlineView] = useState(false);

  if (!activeDiff) return null;

  const currentTab = openTabs.find((t) => t.id === activeDiff.file || t.id === activeTabId);
  const language = currentTab?.path ? getLanguageFromPath(currentTab.path) : "plaintext";

  const originalContent = currentTab?.originalContent || "";
  const modifiedContent = currentTab?.content || "";

  return (
    <div className="flex-1 h-full w-full flex flex-col bg-[#080c1e] select-none text-xs">
      {/* ── Top Diff Header ── */}
      <div className="h-8 px-3 bg-[#070a18] border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 text-xs">
        <div className="flex items-center gap-2 text-slate-300 min-w-0">
          <GitCompare className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <span className="font-mono font-semibold truncate text-[11px]">
            {activeDiff.file || "Git Working Tree Diff"}
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            (HEAD ↔ Working Tree)
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Side-by-Side vs Inline Toggle */}
          <button
            type="button"
            onClick={() => setInlineView(!inlineView)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title={inlineView ? "Switch to Side-by-Side View" : "Switch to Inline Diff View"}
          >
            {inlineView ? (
              <>
                <Split className="w-3 h-3 text-violet-400" />
                <span>Side-by-side</span>
              </>
            ) : (
              <>
                <AlignJustify className="w-3 h-3 text-violet-400" />
                <span>Inline</span>
              </>
            )}
          </button>

          {/* Close Diff Button */}
          <button
            type="button"
            onClick={() => useCodeStore.setState({ activeDiff: null })}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Close Diff Viewer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Monaco Diff Editor ── */}
      <div className="flex-1 w-full h-full overflow-hidden">
        <MonacoDiffEditor
          height="100%"
          width="100%"
          language={language}
          original={originalContent}
          modified={modifiedContent}
          theme="sprintforge-dark"
          options={{
            readOnly: true,
            renderSideBySide: !inlineView,
            fontSize: ideSettings.fontSize,
            fontFamily: ideSettings.fontFamily,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: ideSettings.wordWrap,
          }}
        />
      </div>
    </div>
  );
}
