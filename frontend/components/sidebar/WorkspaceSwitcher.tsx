"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Check,
  Plus,
  FolderKanban,
  Settings,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { useProjectStore, Project } from "@/lib/store/projectStore";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  isCollapsed: boolean;
  activeProjectId?: string | null;
  onCloseMobile?: () => void;
}

export function WorkspaceSwitcher({
  isCollapsed,
  activeProjectId,
  onCloseMobile,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const { projects, currentProject, setCurrentProject } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive active project
  const activeProject: Project | undefined =
    projects.find((p) => p._id === activeProjectId) ||
    currentProject ||
    projects[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setIsOpen(false);
    onCloseMobile?.();
    router.push(`/dashboard/projects/${project._id}/board`);
  };

  if (!activeProject && projects.length === 0) {
    if (isCollapsed) return null;
    return (
      <div className="px-3 py-2">
        <Link
          href="/dashboard/projects/new"
          onClick={onCloseMobile}
          className="flex items-center gap-2 p-2 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs font-bold text-violet-300 hover:bg-violet-600/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Workspace</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative px-2.5 py-1.5" ref={dropdownRef}>
      {/* ── Switcher Button ── */}
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-white text-xs font-bold font-mono shadow-sm transition-transform hover:scale-105 cursor-pointer ring-1 ring-white/[0.1] hover:ring-violet-500/50"
          style={{ backgroundColor: activeProject?.color || "#6366f1" }}
          title={activeProject?.name || "Workspace"}
        >
          {activeProject?.key?.charAt(0) || "P"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-2.5 p-2 rounded-2xl border transition-all text-left group cursor-pointer",
            isOpen
              ? "bg-[#0b1028] border-violet-500/40 shadow-sm"
              : "bg-[#080c1e]/80 border-white/[0.06] hover:bg-[#0b1028] hover:border-white/[0.12]"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold font-mono shadow-sm flex-shrink-0"
              style={{ backgroundColor: activeProject?.color || "#6366f1" }}
            >
              {activeProject?.key?.charAt(0) || "P"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate group-hover:text-violet-200 transition-colors">
                {activeProject?.name || "Select Workspace"}
              </p>
              <p className="text-[10px] font-mono text-slate-400 truncate capitalize">
                {activeProject?.type || "Scrum"} · {activeProject?.members?.length || 1} {activeProject?.members?.length === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 flex-shrink-0",
              isOpen && "rotate-180 text-violet-400"
            )}
          />
        </button>
      )}

      {/* ── Switcher Dropdown Popover ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 mt-1.5 w-64 bg-[#090d20] border border-white/[0.12] rounded-2xl shadow-2xl p-2 space-y-1.5 backdrop-blur-xl",
              isCollapsed ? "left-14 top-0" : "left-2.5 right-2.5"
            )}
          >
            <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              <span>Workspaces</span>
              <span>{projects.length} Total</span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-0.5 scrollbar-thin">
              {projects.map((project) => {
                const isSelected = activeProject?._id === project._id;
                return (
                  <button
                    key={project._id}
                    type="button"
                    onClick={() => handleSelectProject(project)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer text-xs font-semibold",
                      isSelected
                        ? "bg-violet-600/15 text-white border border-violet-500/30"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: project.color || "#6366f1" }}
                      >
                        {project.key?.charAt(0) || "P"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">{project.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {project.key} · {project.members?.length || 1} members
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="pt-1.5 border-t border-white/[0.06] space-y-0.5">
              <Link
                href="/dashboard/projects/new"
                onClick={() => {
                  setIsOpen(false);
                  onCloseMobile?.();
                }}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-violet-300 hover:text-white hover:bg-violet-600/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Project</span>
              </Link>
              <Link
                href="/dashboard/projects"
                onClick={() => {
                  setIsOpen(false);
                  onCloseMobile?.();
                }}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>All Projects Overview</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
