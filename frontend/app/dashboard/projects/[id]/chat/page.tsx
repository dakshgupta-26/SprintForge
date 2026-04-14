"use client";

import { use, useEffect } from "react";
import { useProjectStore } from "@/lib/store/projectStore";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { motion } from "framer-motion";

export default function ProjectChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentProject, fetchProject } = useProjectStore();

  useEffect(() => {
    if (!currentProject || currentProject._id !== id) {
      fetchProject(id);
    }
  }, [id, currentProject, fetchProject]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="h-[calc(100vh-100px)] w-full max-w-6xl mx-auto"
    >
      <ChatRoom projectId={id} />
    </motion.div>
  );
}
