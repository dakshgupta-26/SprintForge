"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { taskAPI, sprintAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { motion } from "framer-motion";
import { PersonalWorkSummary } from "@/components/dashboard/PersonalWorkSummary";
import { MyWorkWorkspace } from "@/components/dashboard/MyWorkWorkspace";
import { ActiveSprintWidget } from "@/components/dashboard/ActiveSprintWidget";
import { UpcomingDeadlinesCard } from "@/components/dashboard/UpcomingDeadlinesCard";
import { ProjectsGridCard } from "@/components/dashboard/ProjectsGridCard";
import { QuickActionsAndJoin } from "@/components/dashboard/QuickActionsAndJoin";
import { SprintForgeAIBrief } from "@/components/dashboard/SprintForgeAIBrief";
import { TaskDetailDrawer } from "@/components/board/TaskDetailDrawer";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();

  const [tasks, setTasks] = useState<any[]>([]);
  const [activeSprint, setActiveSprint] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  // Real data calculations
  const [stats, setStats] = useState({
    dueToday: 0,
    inProgress: 0,
    inReview: 0,
    overdue: 0,
    completed: 0,
    blocked: 0,
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetchProjects();

      // Load tasks assigned to current user
      const { data: userTasks } = await taskAPI.getAll({ assignee: user?._id });
      setTasks(userTasks || []);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const todayEnd = todayStart + 86400000;

      let dueToday = 0;
      let inProgress = 0;
      let inReview = 0;
      let overdue = 0;
      let completed = 0;
      let blocked = 0;

      userTasks.forEach((t: any) => {
        const dueTime = t.dueDate ? new Date(t.dueDate).getTime() : 0;
        const isDone = t.status === "done";

        if (isDone) completed++;
        else {
          if (t.status === "in_progress") inProgress++;
          if (t.status === "review" || t.status === "in_review") inReview++;
          if (t.status === "blocked" || t.priority === "critical") blocked++;

          if (dueTime > 0) {
            if (dueTime < todayStart) overdue++;
            else if (dueTime <= todayEnd) dueToday++;
          }
        }
      });

      setStats({ dueToday, inProgress, inReview, overdue, completed, blocked });
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, fetchProjects]);

  // Load active sprint from primary project
  useEffect(() => {
    if (projects.length > 0) {
      const primaryProjectId = projects[0]._id;
      sprintAPI
        .getAll(primaryProjectId)
        .then((res) => {
          const active = (res.data || []).find((s: any) => s.status === "active");
          setActiveSprint(active || null);
        })
        .catch(() => {});
    }
  }, [projects]);

  useEffect(() => {
    if (user?._id) {
      loadDashboardData();
    }
  }, [user?._id, loadDashboardData]);

  // ── Real-time Socket Listener ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleTaskChange = () => {
      loadDashboardData();
    };

    socket.on("task:created", handleTaskChange);
    socket.on("task:updated", handleTaskChange);
    socket.on("task:moved", handleTaskChange);
    socket.on("task:deleted", handleTaskChange);

    return () => {
      socket.off("task:created", handleTaskChange);
      socket.off("task:updated", handleTaskChange);
      socket.off("task:moved", handleTaskChange);
      socket.off("task:deleted", handleTaskChange);
    };
  }, [loadDashboardData]);

  const primaryProject = projects[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* ── 1. CONTEXTUAL GREETING & INTERACTIVE STATS ── */}
      <PersonalWorkSummary
        userName={user?.name || "Developer"}
        activeFilter={activeFilter}
        onFilterSelect={(f) => setActiveFilter(f)}
        stats={stats}
      />

      {/* ── 2. AI INTELLIGENCE BRIEF ── */}
      <SprintForgeAIBrief
        stats={stats}
        activeSprint={activeSprint}
        onOpenWork={() => setActiveFilter("all")}
      />

      {/* ── 3. MAIN WORKSPACE GRID (2 COLUMNS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: My Work Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <MyWorkWorkspace
            tasks={tasks}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onTaskSelect={(task) => setSelectedTask(task)}
            onOpenCreateTask={() => setShowNewTask(true)}
          />

          {/* Upcoming Deadlines */}
          <UpcomingDeadlinesCard
            tasks={tasks}
            onTaskSelect={(task) => setSelectedTask(task)}
          />
        </div>

        {/* Right Column: Active Sprint, Quick Actions & Join (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <ActiveSprintWidget
            sprint={activeSprint}
            projectId={primaryProject?._id}
            projectName={primaryProject?.name}
          />

          <QuickActionsAndJoin
            onOpenNewTask={() => setShowNewTask(true)}
            onOpenNewProject={() => setShowNewProject(true)}
          />
        </div>
      </div>

      {/* ── 4. PROJECTS OVERVIEW (FULL WIDTH) ── */}
      <ProjectsGridCard
        projects={projects}
        onOpenCreateProject={() => setShowNewProject(true)}
      />

      {/* ── Slide-Over Task Detail Drawer ── */}
      <TaskDetailDrawer
        isOpen={!!selectedTask}
        taskId={selectedTask?._id || null}
        projectId={selectedTask?.project?._id || selectedTask?.project || primaryProject?._id || ""}
        projectMembers={primaryProject?.members || []}
        sprints={[]}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={loadDashboardData}
        onTaskDeleted={() => {
          setSelectedTask(null);
          loadDashboardData();
        }}
      />

      {/* ── Create Task Modal ── */}
      {showNewTask && (
        <CreateTaskModal
          projectId={primaryProject?._id || ""}
          projectName={primaryProject?.name || "TASKDEV"}
          sprintId={activeSprint?._id}
          projectMembers={primaryProject?.members || []}
          onClose={() => setShowNewTask(false)}
          onCreate={() => {
            setShowNewTask(false);
            loadDashboardData();
          }}
        />
      )}

      {/* ── Create Project Modal ── */}
      {showNewProject && (
        <CreateProjectModal
          onClose={() => setShowNewProject(false)}
          onCreate={(newProj) => {
            setShowNewProject(false);
            fetchProjects();
            router.push(`/dashboard/projects/${newProj._id}/board`);
          }}
        />
      )}
    </div>
  );
}
