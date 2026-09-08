"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { useCodeStore, getLanguageFromPath } from "@/lib/store/codeStore";
import { MonacoYjsCollaboration } from "@/lib/codeCollaboration";
import { getSocket } from "@/lib/socket";
import { Users, Save, Lock, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function CodeEditor() {
  const {
    projectId,
    activeTabId,
    activeFileContent,
    updateActiveFileContent,
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
  const collabRef = useRef<MonacoYjsCollaboration | null>(null);

  const [activeFileCollabs, setActiveFileCollabs] = useState<any[]>([]);

  // Calculate collaborators active on current file
  useEffect(() => {
    if (!activeTabId) {
      setActiveFileCollabs([]);
      return;
    }
    const matching = collaborators.filter((c) => c.activeFile === activeTabId);
    setActiveFileCollabs(matching);
  }, [collaborators, activeTabId]);

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

    // Initialize Yjs Real-time Collaboration if inside a project & file
    if (projectId && activeTabId) {
      initCollaboration(editor, monaco);
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

  const initCollaboration = useCallback(
    (editor: any, monaco: Monaco) => {
      if (!projectId || !activeTabId) return;

      // Clean up previous binding
      if (collabRef.current) {
        collabRef.current.destroy();
        collabRef.current = null;
      }

      collabRef.current = new MonacoYjsCollaboration(
        projectId,
        activeTabId,
        editor,
        monaco,
        activeFileContent
      );
    },
    [projectId, activeTabId, activeFileContent]
  );

  // Re-bind when active tab changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current && projectId && activeTabId) {
      initCollaboration(editorRef.current, monacoRef.current);
    }
    return () => {
      if (collabRef.current) {
        collabRef.current.destroy();
        collabRef.current = null;
      }
    };
  }, [activeTabId, projectId, initCollaboration]);

  if (isLoadingFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#080c1e] text-slate-400 gap-3">
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

  const language = getLanguageFromPath(activeTabId);
  const isReadOnly = permission === "VIEW";

  return (
    <div className="relative flex-1 h-full w-full overflow-hidden bg-[#080c1e]">
      {/* ── Top Editor Banner / Presence Badge ── */}
      <div className="absolute top-2 right-4 z-10 flex items-center gap-2 pointer-events-none">
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
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={activeFileContent}
        theme="sprintforge-dark"
        options={{
          readOnly: isReadOnly,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
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
          padding: { top: 12, bottom: 12 },
        }}
        onMount={handleEditorDidMount}
        onChange={(val) => {
          if (val !== undefined) {
            updateActiveFileContent(val, true);
          }
        }}
      />
    </div>
  );
}
