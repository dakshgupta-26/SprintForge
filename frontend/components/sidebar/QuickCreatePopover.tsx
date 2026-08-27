"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Zap,
  FolderKanban,
  Bug,
  BookOpen,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { useProjectStore } from "@/lib/store/projectStore";
import { cn } from "@/lib/utils";

interface QuickCreatePopoverProps {
  isCollapsed: boolean;
  onCloseMobile?: () => void;
}

export function QuickCreatePopover({ isCollapsed, onCloseMobile }: QuickCreatePopoverProps) {
  const router = useRouter();
  const { projects, currentProject } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const activeProject = currentProject || projects[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleAction = (href: string) => {
    setIsOpen(false);
    onCloseMobile?.();
    router.push(href);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center rounded-xl transition-all cursor-pointer",
          isCollapsed
            ? "w-8 h-8 mx-auto bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white"
            : "p-1.5 hover:bg-white/[0.06] text-slate-400 hover:text-white"
        )}
        title="Quick Create"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 mt-1.5 w-52 bg-[#090d20] border border-white/[0.12] rounded-2xl shadow-2xl p-1.5 space-y-0.5 backdrop-blur-xl",
              isCollapsed ? "left-12 top-0" : "right-0 top-full"
            )}
          >
            <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Quick Create
            </div>

            {activeProject && (
              <>
                <button
                  type="button"
                  onClick={() => handleAction(`/dashboard/projects/${activeProject._id}/board`)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
                  <span>Work Item / Task</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(`/dashboard/projects/${activeProject._id}/issues`)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                >
                  <Bug className="w-3.5 h-3.5 text-rose-400" />
                  <span>Bug / Issue</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(`/dashboard/projects/${activeProject._id}/wiki`)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Wiki Documentation</span>
                </button>
              </>
            )}

            <div className="pt-1 border-t border-white/[0.06] mt-1">
              <button
                type="button"
                onClick={() => handleAction("/dashboard/projects/new")}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white hover:bg-indigo-600/20 transition-colors cursor-pointer text-left"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
