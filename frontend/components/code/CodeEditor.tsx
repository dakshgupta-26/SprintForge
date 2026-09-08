"use client";

import React, { useRef, useEffect, useMemo } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { useCodeStore } from "@/lib/store/codeStore";
import { monacoModelManager } from "@/lib/monacoModelManager";
import { getSocket } from "@/lib/socket";
import { getFileIcon } from "./FileTreeItem";
import { Users, Lock, Loader2, Sparkles, Copy, Check, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";

export function CodeEditor() {
  const {
    projectId,
    activeTabId,
    openTabs,
    saveActiveFile,
    isSaving,
    isLoadingFile,
    permission,
    collaborators,
    setCommandPaletteOpen,
    setQuickOpenOpen,
    toggleTerminal,
    setActiveActivityBarView,
  } = useCodeStore();

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Active tab metadata
  const activeTab = useMemo(
    () => openTabs.find((t) => t.id === activeTabId),
    [openTabs, activeTabId]
  );

  // Calculate collaborators active on current file
  const activeFileCollabs = useMemo(() => {
    if (!activeTabId) return [];
    return collaborators.filter((c) => c.activeFile === activeTabId);
  }, [collaborators, activeTabId]);

  // Breadcrumb path segments
  const breadcrumbSegments = useMemo(() => {
    if (!activeTabId) return [];
    return activeTabId.split("/");
  }, [activeTabId]);

  // Broadcast current active file presence
  useEffect(() => {
    const socket = getSocket();
    if (socket?.connected && projectId) {
      socket.emit("code:presence:active_file", {
        projectId,
        activeFile: activeTabId || undefined,
      });
    }
  }, [projectId, activeTabId]);

  // Handle Monaco Mount
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monacoModelManager.setMonaco(monaco);

    // Define SprintForge Dark Monaco Theme
    monaco.editor.defineTheme("sprintforge-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
        { token: "keyword", foreground: "c084fc", fontStyle: "bold" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "38bdf8" },
        { token: "type", foreground: "818cf8" },
        { token: "function", foreground: "60a5fa" },
        { token: "variable", foreground: "f1f5f9" },
        { token: "constant", foreground: "fb923c" },
      ],
      colors: {
        "editor.background": "#080c1e",
        "editor.foreground": "#e2e8f0",
        "editor.lineHighlightBackground": "#ffffff08",
        "editorCursor.foreground": "#a855f7",
        "editorWhitespace.foreground": "#ffffff15",
        "editorIndentGuide.background": "#ffffff10",
        "editorIndentGuide.activeBackground": "#a855f740",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#a855f7",
        "editor.selectionBackground": "#8b5cf633",
        "editor.inactiveSelectionBackground": "#8b5cf61a",
      },
    });

    monaco.editor.setTheme("sprintforge-dark");

    // Bind canonical model and collaboration for currently active tab
    if (projectId && activeTabId) {
      const model = monacoModelManager.getOrCreateModel(
        monaco,
        projectId,
        activeTabId,
        activeTab?.content || ""
      );
      editor.setModel(model);
      monacoModelManager.getOrCreateCollaboration(
        monaco,
        editor,
        projectId,
        activeTabId,
        activeTab?.content
      );
    }

    // Register IDE Global Keybindings inside Monaco Editor
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveActiveFile();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      setQuickOpenOpen(true);
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
      () => {
        setCommandPaletteOpen(true);
      }
    );

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        setActiveActivityBarView("search");
      }
    );

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote, () => {
      toggleTerminal();
    });
  };

  // Switch Monaco canonical model cleanly when active tab changes (only on activeTabId/projectId change)
  useEffect(() => {
    if (editorRef.current && monacoRef.current && projectId && activeTabId) {
      const model = monacoModelManager.getOrCreateModel(
        monacoRef.current,
        projectId,
        activeTabId,
        activeTab?.content || ""
      );

      if (editorRef.current.getModel() !== model) {
        editorRef.current.setModel(model);
      }

      monacoModelManager.getOrCreateCollaboration(
        monacoRef.current,
        editorRef.current,
        projectId,
        activeTabId,
        activeTab?.content
      );
    }
  }, [activeTabId, projectId]);

  const handleCopyPath = () => {
    if (!activeTabId) return;
    navigator.clipboard.writeText(activeTabId);
    setCopied(true);
    toast.success(`Copied path: ${activeTabId}`);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isLoadingFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#080c1e] text-slate-400 gap-3 select-none">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        <p className="text-xs font-mono">Loading file buffer...</p>
      </div>
    );
  }

  if (!activeTabId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#080c1e] text-slate-500 p-6 select-none">
        <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400 shadow-inner">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">
          No File Open
        </h3>
        <p className="text-xs text-slate-500 text-center max-w-sm mb-4">
          Select a file from the explorer on the left, or use shortcuts to search.
        </p>

        <div className="flex flex-col gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center justify-between gap-6 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span>Quick Open</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-violet-300">
              Ctrl+P
            </kbd>
          </div>
          <div className="flex items-center justify-between gap-6 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span>Command Palette</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-violet-300">
              Ctrl+Shift+P
            </kbd>
          </div>
          <div className="flex items-center justify-between gap-6 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span>Project Search</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-violet-300">
              Ctrl+Shift+F
            </kbd>
          </div>
          <div className="flex items-center justify-between gap-6 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span>Toggle Terminal</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-violet-300">
              Ctrl+`
            </kbd>
          </div>
        </div>
      </div>
    );
  }

  const isReadOnly = permission === "VIEW";
  const ext = activeTabId.split(".").pop();
  const fileName = breadcrumbSegments[breadcrumbSegments.length - 1];

  return (
    <div className="relative flex-1 h-full w-full flex flex-col overflow-hidden bg-[#080c1e]">
      {/* ── Top Breadcrumbs Strip ── */}
      <div className="h-7 px-3 bg-[#070b1c] border-b border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400 flex-shrink-0 z-10 select-none">
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

        {/* Action button: Copy Path */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPath}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Copy Relative Path"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* ── Top Right Editor Banner / Presence Badges ── */}
      <div className="absolute top-9 right-4 z-20 flex items-center gap-2 pointer-events-none">
        {/* Read Only Badge */}
        {isReadOnly && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium shadow-lg backdrop-blur-md">
            <Lock className="w-3 h-3" />
            <span>Read Only Mode</span>
          </div>
        )}

        {/* Live Collaborators Pill */}
        {activeFileCollabs.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-200 text-[11px] font-medium shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Users className="w-3 h-3" />
            <span>
              {activeFileCollabs.length}{" "}
              {activeFileCollabs.length === 1 ? "collaborator" : "collaborators"}
            </span>
          </div>
        )}

        {/* Saving Indicator */}
        {isSaving && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/[0.1] text-slate-300 text-[11px] font-mono shadow-lg backdrop-blur-md">
            <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
            <span>Saving...</span>
          </div>
        )}
      </div>

      {/* ── Monaco Editor Instance ── */}
      <div className="flex-1 w-full h-full min-h-0 overflow-hidden relative">
        <Editor
          height="100%"
          width="100%"
          theme="sprintforge-dark"
          options={{
            readOnly: isReadOnly,
            fontSize: 13,
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontLigatures: true,
            tabSize: 2,
            minimap: { enabled: true, side: "right", scale: 1 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderWhitespace: "selection",
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            glyphMargin: true,
            automaticLayout: true,
            folding: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
            wordWrap: "on",
            padding: { top: 8, bottom: 12 },
          }}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
}
