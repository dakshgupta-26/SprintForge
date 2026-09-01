"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store/projectStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  WorkspaceBootLoader,
  WorkspaceStage,
} from "@/components/shared/WorkspaceBootLoader";

const PROJECT_BOOT_STAGES: WorkspaceStage[] = [
  { id: "connect", label: "Connecting to workspace", completedLabel: "Connected to workspace" },
  { id: "project", label: "Loading project data", completedLabel: "Project verified" },
  { id: "team", label: "Syncing project members", completedLabel: "Members synchronized" },
  { id: "workspace", label: "Preparing workspace", completedLabel: "Workspace ready" },
];

/**
 * Project Layout
 *
 * Single source-of-truth for initializing and loading the active project workspace
 * into the Zustand store, providing an animated boot experience during network transitions.
 */
export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { fetchProject, currentProject } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState(false);

  const loadProject = useCallback(async () => {
    if (!id) return;

    // Only re-fetch if we're switching to a different project
    if (currentProject?._id === id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    setStageIndex(0);

    try {
      setStageIndex(1);
      await fetchProject(id);
      setStageIndex(2);
      // Small state tick for members sync and workspace readiness
      setStageIndex(3);
      setLoading(false);
    } catch (err: any) {
      setError(true);
      setLoading(false);
    }
  }, [id, currentProject?._id, fetchProject]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (loading || error) {
    return (
      <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center p-2 sm:p-4">
        <WorkspaceBootLoader
          variant="embedded"
          title="SprintForge"
          subtitle={currentProject?.name ? `${currentProject.name.toUpperCase()}` : "PROJECT WORKSPACE"}
          stages={PROJECT_BOOT_STAGES}
          currentStageIndex={stageIndex}
          status={error ? "error" : "loading"}
          errorTitle="Project Unavailable"
          errorMessage="This project could not be found or you don't have access permissions."
          onRetry={loadProject}
          onBack={() => router.push("/dashboard")}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
