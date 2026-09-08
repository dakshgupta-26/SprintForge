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
import { CodeErrorBoundary } from "./CodeErrorBoundary";
import { CodeWorkspaceSkeleton } from "./CodeWorkspaceSkeleton";
import { cn } from "@/lib/utils";

interface CodeWorkspaceProps {
  projectId: string;
}

export function CodeWorkspace({ projectId }: CodeWorkspaceProps) {
  const {
    initWorkspace,
    loading,
    initError,
    activeActivityBarView,
    activeDiff,
    setCollaborators,
    setSyncStatus,
    saveActiveFile,
    setCommandPaletteOpen,
    setQuickOpenOpen,
    setActiveActivityBarView,
    toggleTerminal,
    handleRemoteFileCreated,
    handleRemoteFileDeleted,
    handleRemoteFileRenamed,
    handleRemoteFileUpdated,
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

  // Real-time Socket.IO workspace connection and file event synchronization
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !projectId) return;

    const joinWorkspace = () => {
      const joinData = {
        projectId,
        userId: user?._id,
        name: user?.name,
        avatar: user?.avatar,
      };
      socket.emit("code:join:workspace", joinData);
      setSyncStatus("synced");
    };

    if (socket.connected) {
      joinWorkspace();
    }

    const handleConnect = () => {
      joinWorkspace();
    };

    const handleDisconnect = () => {
      setSyncStatus("reconnecting");
    };

    const handlePresenceSync = (data: { projectId: string; collaborators: any[] }) => {
      if (data.projectId === projectId) {
        setCollaborators(data.collaborators || []);
      }
    };

    const handleFileCreated = (data: { projectId: string; path: string; type?: "file" | "folder" }) => {
      if (data.projectId === projectId) {
        handleRemoteFileCreated({ path: data.path, type: data.type });
      }
    };

    const handleFileDeleted = (data: { projectId: string; path: string }) => {
      if (data.projectId === projectId) {
        handleRemoteFileDeleted({ path: data.path });
      }
    };

    const handleFileRenamed = (data: { projectId: string; oldPath: string; newPath: string }) => {
      if (data.projectId === projectId) {
        handleRemoteFileRenamed({ oldPath: data.oldPath, newPath: data.newPath });
      }
    };

    const handleFileUpdated = (data: { projectId: string; path: string }) => {
      if (data.projectId === projectId) {
        handleRemoteFileUpdated({ path: data.path });
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("code:presence:sync", handlePresenceSync);
    socket.on("code:file:created", handleFileCreated);
    socket.on("code:file:deleted", handleFileDeleted);
    socket.on("code:file:renamed", handleFileRenamed);
    socket.on("code:file:updated", handleFileUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("code:presence:sync", handlePresenceSync);
      socket.off("code:file:created", handleFileCreated);
      socket.off("code:file:deleted", handleFileDeleted);
      socket.off("code:file:renamed", handleFileRenamed);
      socket.off("code:file:updated", handleFileUpdated);
    };
  }, [
    projectId,
    user,
    setCollaborators,
    setSyncStatus,
    handleRemoteFileCreated,
    handleRemoteFileDeleted,
    handleRemoteFileRenamed,
    handleRemoteFileUpdated,
  ]);

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

  if (loading || initError) {
    return (
      <CodeWorkspaceSkeleton
        error={initError}
        onRetry={() => initWorkspace(projectId)}
      />
    );
  }

  return (
    <CodeErrorBoundary
      componentName="SprintForge Code Workspace"
      fallbackTitle="Code Workspace encountered an error"
      onReset={() => initWorkspace(projectId)}
    >
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
            <CodeErrorBoundary componentName="Sidebar Activity Panel">
              {activeActivityBarView === "explorer" && <FileExplorer />}
              {activeActivityBarView === "git" && <SourceControlPanel />}
              {activeActivityBarView === "search" && <SearchPanel />}
              {activeActivityBarView === "collab" && <CollaborationPanel />}
              {activeActivityBarView === "activity" && <CodeActivityPanel />}
            </CodeErrorBoundary>
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
            <CodeErrorBoundary componentName="Editor Tabs Strip">
              <EditorTabs />
            </CodeErrorBoundary>

            {/* Active Editor or Diff Viewer */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative">
              <CodeErrorBoundary componentName="Monaco Code Editor">
                {activeDiff ? <DiffEditor /> : <CodeEditor />}
              </CodeErrorBoundary>
            </div>

            {/* Bottom Terminal Panel */}
            <CodeErrorBoundary componentName="Integrated Terminal">
              <TerminalPanel />
            </CodeErrorBoundary>
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
    </CodeErrorBoundary>
  );
}
