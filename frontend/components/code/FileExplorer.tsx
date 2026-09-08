"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FilePlus,
  FolderPlus,
  RotateCw,
  FolderTree,
  ChevronDown,
  Trash2,
  Edit2,
  Copy,
  Download,
  X,
  Check,
  Minimize2,
  Layers,
} from "lucide-react";
import { useCodeStore, FileTreeItem as IFileTreeItem } from "@/lib/store/codeStore";
import { FileTreeItem } from "./FileTreeItem";
import { cn } from "@/lib/utils";

export function FileExplorer() {
  const {
    fileTree,
    loadFileTree,
    createFile,
    createFolder,
    renamePath,
    deletePath,
    duplicateFile,
    collapseAllFolders,
    permission,
    workspace,
  } = useCodeStore();

  const [creatingType, setCreatingType] = useState<"file" | "folder" | null>(null);
  const [creationPath, setCreationPath] = useState("");
  const [creationInputValue, setCreationInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    item: IFileTreeItem;
    x: number;
    y: number;
  } | null>(null);

  // Rename Dialog State
  const [renamingItem, setRenamingItem] = useState<IFileTreeItem | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingType || renamingItem) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [creatingType, renamingItem]);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleStartCreate = (type: "file" | "folder", basePath = "") => {
    if (permission === "VIEW" || isSubmitting) return;
    setCreatingType(type);
    setCreationPath(basePath);
    setCreationInputValue("");
    setContextMenu(null);
  };

  const handleConfirmCreate = async () => {
    const rawVal = creationInputValue.trim();
    if (!rawVal || isSubmitting) {
      setCreatingType(null);
      return;
    }

    const cleanInput = rawVal.replace(/\\/g, "/").replace(/^\/+/, "");
    const fullPath = creationPath
      ? `${creationPath.replace(/\\/g, "/").replace(/^\/+/, "")}/${cleanInput}`
      : cleanInput;

    setIsSubmitting(true);
    try {
      if (creatingType === "file") {
        await createFile(fullPath);
      } else if (creatingType === "folder") {
        await createFolder(fullPath);
      }
    } finally {
      setIsSubmitting(false);
      setCreatingType(null);
      setCreationInputValue("");
    }
  };

  const handleConfirmRename = async () => {
    if (!renamingItem || !renameInputValue.trim() || isSubmitting) {
      setRenamingItem(null);
      return;
    }

    const parts = renamingItem.path.split("/");
    parts[parts.length - 1] = renameInputValue.trim().replace(/\\/g, "/");
    const newPath = parts.join("/");

    if (newPath !== renamingItem.path) {
      setIsSubmitting(true);
      try {
        await renamePath(renamingItem.path, newPath);
      } finally {
        setIsSubmitting(false);
      }
    }

    setRenamingItem(null);
    setRenameInputValue("");
  };

  const handleContextMenu = (e: React.MouseEvent, item: IFileTreeItem) => {
    setContextMenu({
      item,
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#070a14] select-none text-slate-300 text-xs">
      {/* ── Top Explorer Header ── */}
      <div className="h-9 px-3 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#070a14]">
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderTree className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <span className="font-mono font-bold uppercase text-[11px] text-slate-300 truncate">
            Explorer
          </span>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-0.5">
          {permission !== "VIEW" && (
            <>
              <button
                type="button"
                onClick={() => handleStartCreate("file")}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="New File"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleStartCreate("folder")}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="New Folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => loadFileTree()}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Refresh Explorer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={collapseAllFolders}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Collapse All Folders"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── File Tree List Scroll Area ── */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5 scrollbar-thin">
        {/* Inline Create Input */}
        {creatingType && (
          <div className="px-2 py-1.5 rounded-lg bg-violet-950/50 border border-violet-500/40 flex items-center gap-2 mb-1">
            {creatingType === "file" ? (
              <FilePlus className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            ) : (
              <FolderPlus className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={creationInputValue}
              onChange={(e) => setCreationInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmCreate();
                if (e.key === "Escape") setCreatingType(null);
              }}
              placeholder={creatingType === "file" ? "filename.ext" : "folder_name"}
              className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-slate-500 font-mono"
            />
            <button
              type="button"
              onClick={handleConfirmCreate}
              className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
              title="Create"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCreatingType(null)}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tree Items */}
        {fileTree.length === 0 && !creatingType ? (
          <div className="py-8 text-center text-xs text-slate-500">
            <p>No files in workspace</p>
            {permission !== "VIEW" && (
              <button
                type="button"
                onClick={() => handleStartCreate("file")}
                className="mt-2 text-violet-400 hover:underline font-semibold cursor-pointer"
              >
                + Create file
              </button>
            )}
          </div>
        ) : (
          fileTree.map((item) => (
            <FileTreeItem
              key={item.id}
              item={item}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      {/* ── Context Menu Popover ── */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 min-w-[170px] bg-[#0c1024] border border-white/[0.12] rounded-xl shadow-2xl py-1 text-xs text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item.type === "folder" && permission !== "VIEW" && (
            <>
              <button
                type="button"
                onClick={() => handleStartCreate("file", contextMenu.item.path)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-violet-600/20 hover:text-white transition-colors text-left cursor-pointer"
              >
                <FilePlus className="w-3.5 h-3.5 text-violet-400" />
                New File...
              </button>
              <button
                type="button"
                onClick={() => handleStartCreate("folder", contextMenu.item.path)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-violet-600/20 hover:text-white transition-colors text-left cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-violet-400" />
                New Folder...
              </button>
              <div className="h-px bg-white/[0.08] my-1" />
            </>
          )}

          {permission !== "VIEW" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setRenamingItem(contextMenu.item);
                  setRenameInputValue(contextMenu.item.name);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-violet-600/20 hover:text-white transition-colors text-left cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                Rename
              </button>
              {contextMenu.item.type === "file" && (
                <button
                  type="button"
                  onClick={() => {
                    duplicateFile(contextMenu.item.path);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-violet-600/20 hover:text-white transition-colors text-left cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  Duplicate
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.item.path);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-violet-600/20 hover:text-white transition-colors text-left cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            Copy Relative Path
          </button>

          {permission !== "VIEW" && (
            <>
              <div className="h-px bg-white/[0.08] my-1" />
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${contextMenu.item.path}?`)) {
                    deletePath(contextMenu.item.path);
                  }
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-600/20 text-rose-400 hover:text-rose-300 transition-colors text-left cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Rename Modal Overlay ── */}
      {renamingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0a0e22] border border-white/[0.12] rounded-2xl shadow-2xl p-4 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-200">
              Rename {renamingItem.type}
            </h4>
            <input
              ref={inputRef}
              type="text"
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmRename();
                if (e.key === "Escape") setRenamingItem(null);
              }}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenamingItem(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors cursor-pointer"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
