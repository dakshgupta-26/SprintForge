"use client";

import React from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FileSpreadsheet,
  Terminal,
  Layers,
  Database,
  Globe,
  Settings,
  Shield,
  File,
} from "lucide-react";
import { FileTreeItem as IFileTreeItem, useCodeStore } from "@/lib/store/codeStore";
import { cn } from "@/lib/utils";

interface FileTreeItemProps {
  item: IFileTreeItem;
  level?: number;
  onContextMenu?: (e: React.MouseEvent, item: IFileTreeItem) => void;
}

export function getFileIcon(extension?: string, fileName?: string) {
  const ext = extension?.toLowerCase();
  const name = fileName?.toLowerCase() || "";

  if (name === "package.json" || name === "tsconfig.json" || name.endsWith(".json")) {
    return <FileJson className="w-4 h-4 text-amber-400 flex-shrink-0" />;
  }
  if (name === "dockerfile" || name === ".dockerignore") {
    return <Terminal className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
  }
  if (name === "readme.md" || name === "license") {
    return <FileText className="w-4 h-4 text-sky-400 flex-shrink-0" />;
  }
  if (name.startsWith(".env")) {
    return <Settings className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
  }
  if (name === ".gitignore" || name === ".gitattributes") {
    return <Shield className="w-4 h-4 text-orange-400 flex-shrink-0" />;
  }

  switch (ext) {
    case "ts":
    case "tsx":
    case "mts":
    case "cts":
      return <FileCode className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return <FileCode className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
    case "json":
    case "json5":
    case "jsonc":
      return <FileJson className="w-4 h-4 text-amber-400 flex-shrink-0" />;
    case "md":
    case "markdown":
      return <FileText className="w-4 h-4 text-sky-300 flex-shrink-0" />;
    case "css":
    case "scss":
    case "sass":
    case "less":
      return <FileCode className="w-4 h-4 text-pink-400 flex-shrink-0" />;
    case "html":
    case "htm":
      return <Globe className="w-4 h-4 text-orange-400 flex-shrink-0" />;
    case "py":
    case "python":
      return <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
    case "go":
      return <FileCode className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
    case "rs":
      return <FileCode className="w-4 h-4 text-orange-500 flex-shrink-0" />;
    case "java":
    case "class":
      return <FileCode className="w-4 h-4 text-red-400 flex-shrink-0" />;
    case "cpp":
    case "c":
    case "h":
    case "hpp":
      return <FileCode className="w-4 h-4 text-indigo-400 flex-shrink-0" />;
    case "cs":
      return <FileCode className="w-4 h-4 text-purple-400 flex-shrink-0" />;
    case "php":
      return <FileCode className="w-4 h-4 text-violet-400 flex-shrink-0" />;
    case "sql":
      return <Database className="w-4 h-4 text-amber-300 flex-shrink-0" />;
    case "sh":
    case "bash":
    case "zsh":
      return <Terminal className="w-4 h-4 text-green-400 flex-shrink-0" />;
    case "yml":
    case "yaml":
      return <Layers className="w-4 h-4 text-rose-400 flex-shrink-0" />;
    case "csv":
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
    default:
      return <File className="w-4 h-4 text-slate-400 flex-shrink-0" />;
  }
}

export function FileTreeItem({ item, level = 0, onContextMenu }: FileTreeItemProps) {
  const {
    openFile,
    activeTabId,
    expandedFolders,
    toggleFolder,
    gitStatus,
  } = useCodeStore();

  const isFolder = item.type === "folder";
  const isExpanded = expandedFolders.has(item.path);
  const isActive = activeTabId === item.path;

  // Git status match for this file
  const gitItem = gitStatus?.files?.find((f) => f.path === item.path);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      toggleFolder(item.path);
    } else {
      openFile(item.path);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, item);
  };

  return (
    <div className="select-none">
      <div
        onClick={handleClick}
        onContextMenu={handleRightClick}
        style={{ paddingLeft: `${Math.max(6, level * 12 + 6)}px` }}
        className={cn(
          "flex items-center justify-between py-1 pr-2 rounded-md text-xs cursor-pointer transition-colors group",
          isActive
            ? "bg-violet-600/20 text-white font-semibold border border-violet-500/30"
            : "text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Chevron / Folder icon */}
          {isFolder ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-violet-400 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-violet-400/80 flex-shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3.5" />
              {getFileIcon(item.extension, item.name)}
            </>
          )}

          {/* Label */}
          <span
            className={cn(
              "truncate font-mono text-[11px]",
              gitItem?.status === "M" && "text-amber-300",
              gitItem?.status === "A" && "text-emerald-300",
              gitItem?.status === "U" && "text-teal-300"
            )}
          >
            {item.name}
          </span>
        </div>

        {/* Right Indicators: Git Status */}
        {gitItem && (
          <span
            className={cn(
              "text-[9px] font-mono font-bold px-1 rounded",
              gitItem.status === "M" && "text-amber-400 bg-amber-500/10",
              gitItem.status === "A" && "text-emerald-400 bg-emerald-500/10",
              gitItem.status === "D" && "text-rose-400 bg-rose-500/10",
              gitItem.status === "U" && "text-teal-400 bg-teal-500/10"
            )}
          >
            {gitItem.status}
          </span>
        )}
      </div>

      {/* Children Folders/Files */}
      {isFolder && isExpanded && item.children && (
        <div className="space-y-0.5 border-l border-white/[0.04] ml-2.5">
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}
