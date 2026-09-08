"use client";

import React, { useEffect, useState } from "react";
import { useCodeStore } from "@/lib/store/codeStore";
import { useAuthStore } from "@/lib/store/authStore";
import { getSocket } from "@/lib/socket";
import { ActivityBar } from "./ActivityBar";
import { FileExplorer } from "./FileExplorer";
import { SourceControlPanel } from "./SourceControlPanel";
import { SearchPanel } from "./SearchPanel";
import { CollaborationPanel } from "./CollaborationPanel";
import { CodeActivityPanel } from "./CodeActivityPanel";
import { EditorTabs } from "./EditorTabs";
import { CodeEditor } from "./CodeEditor";
import { DiffEditor } from "./DiffEditor";
import { TerminalPanel } from "./TerminalPanel";
import { StatusBar } from "./StatusBar";
import { CodeCommandPalette } from "./CodeCommandPalette";
import { QuickOpenModal } from "./QuickOpenModal";
import { GitHubConnectModal } from "./GitHubConnectModal";
import { CodePermissionsModal } from "./CodePermissionsModal";
import { Loader2, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeWorkspaceProps {
  projectId: string;
}

export function CodeWorkspace({ projectId }: CodeWorkspaceProps) {
  const {
    initWorkspace,
    loading,
    activeActivityBarView,
    activeDiff,
    setCollaborators,
    saveActiveFile,
    setCommandPaletteOpen,
    setQuickOpenOpen,
    setActiveActivityBarView,
    toggleTerminal,
  } = useCodeStore();

  const { user } = useAuthStore();
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);

  // Initialize workspace on mount
  useEffect(() => {
    if (projectId) {
      initWorkspace(projectId);
    }
  }, [projectId, initWorkspace]);

  // Real-time Socket.IO presence connection
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !projectId) return;

    const joinData = {
      projectId,
      userId: user?._id,
      name: user?.name,
      avatar: user?.avatar,
    };

    socket.emit("code:join:workspace", joinData);

    const handlePresenceSync = (data: { projectId: string; collaborators: any[] }) => {
      if (data.projectId === projectId) {
        setCollaborators(data.collaborators || []);
      }
    };

    socket.on("code:presence:sync", handlePresenceSync);

    return () => {
      socket.off("code:presence:sync", handlePresenceSync);
    };
  }, [projectId, user, setCollaborators]);

  // Global window keyboard shortcuts listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S -> Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveActiveFile();
      }
      // Ctrl/Cmd + P -> Quick Open
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setQuickOpenOpen(true);
      }
      // Ctrl/Cmd + Shift + P -> Command Palette
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Ctrl/Cmd + Shift + F -> Search in files
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setActiveActivityBarView("search");
      }
      // Ctrl/Cmd + ` -> Toggle Terminal
      else if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        toggleTerminal();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    saveActiveFile,
    setQuickOpenOpen,
    setCommandPaletteOpen,
    setActiveActivityBarView,
    toggleTerminal,
  ]);

  // Handle Resizing Sidebar
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(180, Math.min(480, moveEvent.clientX - 50));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#070b1a] text-slate-400 gap-3 select-none">
        <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-xl">
          <Code2 className="w-6 h-6 animate-pulse" />
        </div>
        <p className="text-xs font-mono font-medium text-slate-300">
          Loading SprintForge Code Workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col bg-[#070a18] overflow-hidden select-none">
      {/* ── Main Workspace Body (ActivityBar + Sidebar + Editor + Terminal) ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 1. Activity Bar */}
        <ActivityBar />

        {/* 2. Resizable Sidebar Panel */}
        <div
          style={{ width: `${sidebarWidth}px` }}
          className="h-full flex-shrink-0 flex flex-col border-r border-white/[0.08] bg-[#070a18] overflow-hidden"
        >
          {activeActivityBarView === "explorer" && <FileExplorer />}
          {activeActivityBarView === "git" && <SourceControlPanel />}
          {activeActivityBarView === "search" && <SearchPanel />}
          {activeActivityBarView === "collab" && <CollaborationPanel />}
          {activeActivityBarView === "activity" && <CodeActivityPanel />}
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "w-1 h-full cursor-col-resize hover:bg-violet-500/60 transition-colors z-10",
            isResizing && "bg-violet-500"
          )}
        />

        {/* 3. Main Center Area (Tabs + Editor / Diff + Terminal) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#080c1e]">
          {/* Tabs Bar */}
          <EditorTabs />

          {/* Active Editor or Diff Viewer */}
          <div className="flex-1 flex overflow-hidden min-h-0 relative">
            {activeDiff ? <DiffEditor /> : <CodeEditor />}
          </div>

          {/* Bottom Terminal Panel */}
          <TerminalPanel />
        </div>
      </div>

      {/* ── Bottom Status Bar ── */}
      <StatusBar />

      {/* ── Modals ── */}
      <CodeCommandPalette />
      <QuickOpenModal />
      <GitHubConnectModal />
      <CodePermissionsModal />
    </div>
  );
}
