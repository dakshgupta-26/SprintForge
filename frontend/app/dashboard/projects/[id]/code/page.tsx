"use client";

import React from "react";
import { useParams } from "next/navigation";
import { CodeWorkspace } from "@/components/code/CodeWorkspace";

export default function CodePage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;

  if (!projectId) {
    return null;
  }

  return <CodeWorkspace projectId={projectId} />;
}
