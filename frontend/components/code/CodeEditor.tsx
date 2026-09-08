"use client";

import React, { useRef, useEffect, useMemo, useCallback } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { useCodeStore } from "@/lib/store/codeStore";
import { monacoModelManager } from "@/lib/monacoModelManager";
import { getSocket } from "@/lib/socket";
import { EditorBreadcrumbs } from "./EditorBreadcrumbs";
import { Sparkles, Loader2, Code2, Search, Command, Terminal } from "lucide-react";

export function CodeEditor() {
  const {
    projectId,
    activeTabId,
    openTabs,
    saveActiveFile,
    isLoadingFile,
    permission,
    ideSettings,
    setCommandPaletteOpen,
    setQuickOpenOpen,
    toggleTerminal,
    setActiveActivityBarView,
    setProblems,
    setCursorPosition,
  } = useCodeStore();

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // Active tab metadata
  const activeTab = useMemo(
    () => openTabs.find((t) => t.id === activeTabId),
    [openTabs, activeTabId]
  );

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

  // Sync diagnostic markers from Monaco model to store
  const syncMarkers = useCallback(() => {
    if (!monacoRef.current || !activeTabId) return;
    try {
      const markers = monacoRef.current.editor.getModelMarkers({
        resource: monacoModelManager.getModelUri(monacoRef.current, projectId || "proj", activeTabId),
      });

      const parsedProblems = markers.map((m: any, idx: number) => ({
        id: `${activeTabId}-${m.startLineNumber}-${m.startColumn}-${idx}`,
        file: activeTabId,
        message: m.message,
        severity: (m.severity === 8 ? "error" : m.severity === 4 ? "warning" : "info") as any,
        startLineNumber: m.startLineNumber,
        startColumn: m.startColumn,
        endLineNumber: m.endLineNumber,
        endColumn: m.endColumn,
      }));

      setProblems(parsedProblems);
    } catch {}
  }, [activeTabId, projectId, setProblems]);

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
        { token: "delimiter", foreground: "94a3b8" },
      ],
      colors: {
        "editor.background": "#080c1e",
        "editor.foreground": "#e2e8f0",
        "editor.lineHighlightBackground": "#ffffff06",
        "editorCursor.foreground": "#a855f7",
        "editorWhitespace.foreground": "#ffffff12",
        "editorIndentGuide.background": "#ffffff0a",
        "editorIndentGuide.activeBackground": "#a855f744",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#c084fc",
        "editor.selectionBackground": "#8b5cf633",
        "editor.inactiveSelectionBackground": "#8b5cf618",
        "minimap.background": "#080c1e",
        "scrollbarSlider.background": "#ffffff10",
        "scrollbarSlider.hoverBackground": "#ffffff20",
        "scrollbarSlider.activeBackground": "#a855f750",
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

    // Register Cursor Position change listener
    editor.onDidChangeCursorPosition((e: any) => {
      const selection = editor.getSelection();
      let selectionCount = 0;
      if (selection && !selection.isEmpty()) {
        const model = editor.getModel();
        if (model) {
          selectionCount = model.getValueInRange(selection).length;
        }
      }

      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
        selectionCount: selectionCount > 0 ? selectionCount : undefined,
      });
    });

    // Listen for diagnostic marker changes
    monaco.editor.onDidChangeMarkers(() => {
      syncMarkers();
    });

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

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      setActiveActivityBarView("explorer");
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

      syncMarkers();
    }
  }, [activeTabId, projectId, syncMarkers]);

  // Update editor options when user changes ideSettings
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: ideSettings.fontSize,
        tabSize: ideSettings.tabSize,
        fontFamily: ideSettings.fontFamily,
        wordWrap: ideSettings.wordWrap,
        minimap: { enabled: ideSettings.minimap, side: "right", scale: 1 },
        lineNumbers: ideSettings.lineNumbers,
        bracketPairColorization: { enabled: ideSettings.bracketPairColorization },
        cursorStyle: ideSettings.cursorStyle,
        cursorBlinking: ideSettings.cursorBlinking,
        smoothScrolling: ideSettings.smoothScrolling,
      });
    }
  }, [ideSettings]);

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
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-purple-600/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400 shadow-inner">
          <Code2 className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">
          No File Open
        </h3>
        <p className="text-xs text-slate-500 text-center max-w-sm mb-5">
          Select a file from the explorer on the left, or use shortcuts to search workspace.
        </p>

        <div className="flex flex-col gap-2 text-[11px] font-mono text-slate-400 w-64">
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

  return (
    <div className="relative flex-1 h-full w-full flex flex-col overflow-hidden bg-[#080c1e]">
      {/* ── Top Breadcrumbs Strip ── */}
      <EditorBreadcrumbs />

      {/* ── Monaco Editor Instance ── */}
      <div className="flex-1 w-full h-full min-h-0 overflow-hidden relative">
        <Editor
          height="100%"
          width="100%"
          theme="sprintforge-dark"
          options={{
            readOnly: isReadOnly,
            fontSize: ideSettings.fontSize,
            fontFamily: ideSettings.fontFamily,
            fontLigatures: true,
            tabSize: ideSettings.tabSize,
            minimap: { enabled: ideSettings.minimap, side: "right", scale: 1 },
            scrollBeyondLastLine: false,
            smoothScrolling: ideSettings.smoothScrolling,
            cursorBlinking: ideSettings.cursorBlinking,
            cursorStyle: ideSettings.cursorStyle,
            cursorSmoothCaretAnimation: "on",
            renderWhitespace: "selection",
            lineNumbers: ideSettings.lineNumbers,
            lineNumbersMinChars: 3,
            glyphMargin: true,
            automaticLayout: true,
            folding: true,
            bracketPairColorization: { enabled: ideSettings.bracketPairColorization },
            guides: { bracketPairs: true, indentation: true },
            wordWrap: ideSettings.wordWrap,
            padding: { top: 8, bottom: 12 },
          }}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
}
