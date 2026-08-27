"use client";

import React, { useRef } from "react";
import {
  Search,
  Plus,
  Filter,
  Layers,
  ArrowUpDown,
  User,
  AlertTriangle,
  Bug,
  LayoutList,
  AlignJustify,
  CheckCircle2,
  FolderDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  quickFilter: string;
  onQuickFilterChange: (f: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (p: string) => void;
  sortBy: string;
  onSortByChange: (s: string) => void;
  density: "comfortable" | "compact";
  onDensityChange: (d: "comfortable" | "compact") => void;
  onOpenCreateModal: () => void;
  onOpenBacklogDrawer: () => void;
  counts: {
    all: number;
    myTasks: number;
    unassigned: number;
    high: number;
    bugs: number;
    blocked: number;
  };
}

export function BoardToolbar({
  searchQuery,
  onSearchChange,
  quickFilter,
  onQuickFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  onSortByChange,
  density,
  onDensityChange,
  onOpenCreateModal,
  onOpenBacklogDrawer,
  counts,
}: BoardToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const QUICK_FILTERS = [
    { id: "all", label: "All", count: counts.all },
    { id: "my_tasks", label: "My Tasks", count: counts.myTasks },
    { id: "unassigned", label: "Unassigned", count: counts.unassigned },
    { id: "high", label: "High / P0", count: counts.high },
    { id: "bugs", label: "Bugs", count: counts.bugs },
    ...(counts.blocked > 0 ? [{ id: "blocked", label: "Blocked", count: counts.blocked }] : []),
  ];

  return (
    <div className="space-y-3 flex-shrink-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search board tasks by title, ID (SFG-...), assignee... (Press '/' to focus)"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/[0.08] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-600 font-sans"
          />
        </div>

        {/* Dropdowns & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical (P0)</option>
            <option value="high">High (P1)</option>
            <option value="medium">Medium (P2)</option>
            <option value="low">Low (P3)</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            <option value="default">Board Order</option>
            <option value="priority">Highest Priority</option>
            <option value="newest">Newest First</option>
            <option value="points">Story Points</option>
          </select>

          {/* Density Toggle */}
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#060914] p-0.5">
            <button
              onClick={() => onDensityChange("comfortable")}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                density === "comfortable"
                  ? "bg-white/[0.08] text-white"
                  : "text-slate-500 hover:text-slate-300"
              )}
              title="Comfortable Density"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDensityChange("compact")}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                density === "compact"
                  ? "bg-white/[0.08] text-white"
                  : "text-slate-500 hover:text-slate-300"
              )}
              title="Compact Density"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Backlog Drawer Button */}
          <button
            onClick={onOpenBacklogDrawer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Pull tasks from Backlog into Sprint"
          >
            <FolderDown className="w-3.5 h-3.5 text-violet-400" />
            <span>Add from Backlog</span>
          </button>

          {/* Primary Add Task Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-[0_0_18px_rgba(124,92,255,0.35)] hover:shadow-[0_0_24px_rgba(124,92,255,0.55)] transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
            <span className="hidden sm:inline text-[10px] font-mono opacity-60 bg-black/30 px-1 rounded">
              N
            </span>
          </button>
        </div>
      </div>

      {/* Quick Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {QUICK_FILTERS.map((q) => {
          const isSelected = quickFilter === q.id;
          return (
            <button
              key={q.id}
              onClick={() => onQuickFilterChange(q.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border",
                isSelected
                  ? "bg-violet-600/20 border-violet-500/50 text-white shadow-sm"
                  : "bg-[#060914] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              )}
            >
              <span>{q.label}</span>
              <span
                className={cn(
                  "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                  isSelected
                    ? "bg-violet-500 text-white"
                    : "bg-white/[0.06] text-slate-400"
                )}
              >
                {q.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
