"use client";

import React, { use } from "react";
import { ImpactWorkspace } from "@/components/impact/ImpactWorkspace";
import { motion } from "framer-motion";

export default function ProjectImpactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="max-w-7xl mx-auto px-2 sm:px-4"
    >
      <ImpactWorkspace projectId={id} />
    </motion.div>
  );
}
