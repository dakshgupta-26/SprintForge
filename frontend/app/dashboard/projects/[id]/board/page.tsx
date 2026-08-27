"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { sprintAPI, taskAPI } from "@/lib/api";
import { useProjectStore } from "@/lib/store/projectStore";
import { useAuthStore } from "@/lib/store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { SprintHeader } from "@/components/board/SprintHeader";
import { BoardToolbar } from "@/components/board/BoardToolbar";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";
import { AddFromBacklogDrawer } from "@/components/board/AddFromBacklogDrawer";
import toast from "react-hot-toast";

export default function BoardPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentProject, fetchProject } = useProjectStore();
  const { user: currentUser } = useAuthStore();

  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [sprints, setSprints] = useState<any[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBacklogDrawer, setShowBacklogDrawer] = useState(false);

  // Toolbar Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  // Metrics for Toolbar & SprintHeader
  const [boardCounts, setBoardCounts] = useState({
    all: 0,
    myTasks: 0,
    unassigned: 0,
    high: 0,
    bugs: 0,
    blocked: 0,
  });

  const [inProgressCount, setInProgressCount] = useState(0);
  const [inReviewCount, setInReviewCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);

  const loadSprints = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await sprintAPI.getAll(projectId);
      const all = res.data || [];
      setSprints(all);

      const active = all.find((s: any) => s.status === "active");
      const target = active || all[0];
      if (target) {
        setActiveSprint(target);
        setSelectedSprintId(target._id);
      }
    } catch {
      toast.error("Failed to load sprints");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject(projectId);
    loadSprints();
  }, [projectId, fetchProject, loadSprints]);

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setShowCreateModal(true);
      } else if (e.key === "Escape") {
        setShowCreateModal(false);
        setShowBacklogDrawer(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCountsChange = useCallback((counts: any) => {
    setBoardCounts(counts);
    setBlockedCount(counts.blocked || 0);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 flex flex-col min-h-[calc(100vh-140px)]">
      {/* ── 1. ACTIVE SPRINT HEADER & METRICS ── */}
      <SprintHeader
        sprint={activeSprint}
        totalTasks={boardCounts.all}
        inProgressCount={inProgressCount}
        inReviewCount={inReviewCount}
        doneCount={doneCount}
        blockedCount={blockedCount}
        activeMembers={currentProject?.members}
      />

      {/* ── 2. BOARD TOOLBAR & FILTERS ── */}
      <BoardToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        density={density}
        onDensityChange={setDensity}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onOpenBacklogDrawer={() => setShowBacklogDrawer(true)}
        counts={boardCounts}
      />

      {/* ── 3. KANBAN BOARD ── */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          projectId={projectId}
          sprintId={selectedSprintId}
          searchQuery={searchQuery}
          quickFilter={quickFilter}
          priorityFilter={priorityFilter}
          sortBy={sortBy}
          density={density}
          projectMembers={currentProject?.members}
          sprints={sprints}
          currentUser={currentUser}
          onCountsChange={handleCountsChange}
        />
      </div>

      {/* ── Modals & Drawers ── */}
      <CreateTaskModal
        projectId={projectId}
        projectName={currentProject?.name}
        sprintId={selectedSprintId}
        sprints={sprints}
        projectMembers={currentProject?.members}
        onClose={() => setShowCreateModal(false)}
        onCreate={() => {
          setShowCreateModal(false);
          loadSprints();
        }}
      />

      <AddFromBacklogDrawer
        isOpen={showBacklogDrawer}
        onClose={() => setShowBacklogDrawer(false)}
        projectId={projectId}
        sprintId={selectedSprintId}
        sprintName={activeSprint?.name}
        onTaskAddedToSprint={() => {
          loadSprints();
        }}
      />
    </div>
  );
}
