"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ProjectSettingsView } from "@/components/projects/ProjectSettingsView";

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return <ProjectSettingsView projectId={id} />;
}
