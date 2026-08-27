"use client";

import React from "react";
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Layers,
  LayoutList,
  Kanban,
  ListFilter,
  Columns3,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskViewMode = "list" | "compact" | "board";
export type TaskGroupBy = "dueDate" | "status" | "priority" | "project" | "sprint" | "none";
export type TaskSortBy = "dueDate" | "priority" | "points" | "created" | "status" | "title";

interface TaskToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (s: string) => void;
  priorityFilter: string;
  onPriorityChange: (p: string) => void;
  projectFilter: string;
  onProjectChange: (projId: string) => void;
  projectsList: Array<{ _id: string; name: string; key: string }>;
  groupBy: TaskGroupBy;
  onGroupByChange: (g: TaskGroupBy) => void;
  sortBy: TaskSortBy;
  onSortByChange: (s: TaskSortBy) => void;
  sortOrder: "asc" | "desc";
  onToggleSortOrder: () => void;
  viewMode: TaskViewMode;
  onViewModeChange: (v: TaskViewMode) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export function TaskToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  projectFilter,
  onProjectChange,
  projectsList,
  groupBy,
  onGroupByChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  viewMode,
  onViewModeChange,
  onClearFilters,
  activeFilterCount,
}: TaskToolbarProps) {
  return (
    <div className="w-full space-y-3">
      {/* Top Controls Row */}
      <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks, IDs, projects, labels (e.g. SFG-3669)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#090d1f] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#090d1f] border border-white/[0.08] text-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500/60 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Completed</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#090d1f] border border-white/[0.08] text-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500/60 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical (P0)</option>
            <option value="high">High (P1)</option>
            <option value="medium">Medium (P2)</option>
            <option value="low">Low (P3)</option>
          </select>

          {/* Project Filter */}
          {projectsList.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => onProjectChange(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#090d1f] border border-white/[0.08] text-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500/60 cursor-pointer max-w-[150px] truncate"
            >
              <option value="all">All Projects</option>
              {projectsList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          )}

          {/* Group By Selector */}
          <div className="flex items-center gap-1 bg-[#090d1f] border border-white/[0.08] px-2.5 py-1.5 rounded-xl">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={groupBy}
              onChange={(e) => onGroupByChange(e.target.value as TaskGroupBy)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="dueDate" className="bg-[#090d1f]">Group: Due Date</option>
              <option value="status" className="bg-[#090d1f]">Group: Status</option>
              <option value="priority" className="bg-[#090d1f]">Group: Priority</option>
              <option value="project" className="bg-[#090d1f]">Group: Project</option>
              <option value="none" className="bg-[#090d1f]">Group: None</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1 bg-[#090d1f] border border-white/[0.08] px-2.5 py-1.5 rounded-xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as TaskSortBy)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="dueDate" className="bg-[#090d1f]">Sort: Due Date</option>
              <option value="priority" className="bg-[#090d1f]">Sort: Priority</option>
              <option value="points" className="bg-[#090d1f]">Sort: Story Points</option>
              <option value="created" className="bg-[#090d1f]">Sort: Created Date</option>
              <option value="status" className="bg-[#090d1f]">Sort: Status</option>
              <option value="title" className="bg-[#090d1f]">Sort: Title</option>
            </select>
            <button
              onClick={onToggleSortOrder}
              title={`Sort order: ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
              className="p-1 text-slate-400 hover:text-white"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>

          {/* View Switcher: List vs Compact vs Board */}
          <div className="flex items-center p-1 rounded-xl bg-[#090d1f] border border-white/[0.08]">
            <button
              onClick={() => onViewModeChange("list")}
              title="Standard List View"
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                viewMode === "list"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange("compact")}
              title="Compact Dense View"
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                viewMode === "compact"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange("board")}
              title="Mini Kanban Board"
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                viewMode === "board"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Columns3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-slate-500 font-mono">Active Filters:</span>
          {statusFilter !== "all" && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
              Status: <span className="font-bold text-white capitalize">{statusFilter.replace("_", " ")}</span>
              <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" onClick={() => onStatusChange("all")} />
            </span>
          )}
          {priorityFilter !== "all" && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
              Priority: <span className="font-bold text-white capitalize">{priorityFilter}</span>
              <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" onClick={() => onPriorityChange("all")} />
            </span>
          )}
          {projectFilter !== "all" && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
              Project: <span className="font-bold text-white">{projectsList.find((p) => p._id === projectFilter)?.name || projectFilter}</span>
              <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" onClick={() => onProjectChange("all")} />
            </span>
          )}
          {searchQuery && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
              Query: <span className="font-bold text-white">"{searchQuery}"</span>
              <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" onClick={() => onSearchChange("")} />
            </span>
          )}
          <button
            onClick={onClearFilters}
            className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer ml-1"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
