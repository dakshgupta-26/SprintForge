"use client";

import { use, useEffect } from "react";
import { useProjectStore } from "@/lib/store/projectStore";
import { CallWorkspace } from "@/components/call/CallWorkspace";
import { motion } from "framer-motion";

export default function ProjectCallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentProject, fetchProject } = useProjectStore();

  useEffect(() => {
    if (!currentProject || currentProject._id !== id) {
      fetchProject(id);
    }
  }, [id, currentProject, fetchProject]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="h-full w-full"
    >
      <CallWorkspace projectId={id} />
    </motion.div>
  );
}
