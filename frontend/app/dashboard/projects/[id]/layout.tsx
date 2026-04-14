"use client";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { useProjectStore } from "@/lib/store/projectStore";
import { Loader2 } from "lucide-react";

/**
 * Project Layout
 *
 * This layout is REQUIRED so that Next.js App Router can resolve all
 * sub-routes under /dashboard/projects/[id]/* (board, backlog, team, etc.)
 *
 * It also acts as the single source-of-truth for loading the current project
 * into the Zustand store, so every child page gets `currentProject` populated
 * without each page needing its own fetch.
 */
export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const { fetchProject, currentProject } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Only re-fetch if we're switching to a different project
    if (currentProject?._id === id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    fetchProject(id)
      .catch((err: any) => {
        if (err?.response?.status === 404 || err?.response?.status === 403) {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading project…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <span className="text-3xl">🚧</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">Project not found</h2>
        <p className="text-sm text-muted-foreground max-w-xs text-center">
          This project doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
