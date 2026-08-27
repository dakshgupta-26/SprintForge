"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, SearchX, Sparkles, Plus, FolderKanban } from "lucide-react";
import Link from "next/link";

interface TaskEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
}

export function TaskEmptyState({ hasFilters, onClearFilters }: TaskEmptyStateProps) {
  if (hasFilters) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl bg-[#090d1f]/60 border border-white/[0.06] shadow-sm my-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3 text-slate-400">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No matching tasks found</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          No assigned tasks matched your current search filters or criteria.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Reset All Filters
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl bg-[#090d1f]/60 border border-white/[0.06] shadow-sm my-4"
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
        <CheckCircle2 className="w-7 h-7" />
      </div>
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-2">
        You're All Clear ✨
      </span>
      <h3 className="text-base sm:text-lg font-bold text-white mb-1">
        No active tasks assigned to you right now
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-5 leading-relaxed">
        When tasks are created or assigned to you across any engineering project, they will appear here automatically with real-time updates.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md transition-all"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Explore Projects</span>
        </Link>
      </div>
    </motion.div>
  );
}
