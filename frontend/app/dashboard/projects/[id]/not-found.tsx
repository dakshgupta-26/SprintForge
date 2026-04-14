"use client";

import Link from "next/link";
import { FolderKanban, ArrowLeft } from "lucide-react";

export default function ProjectNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <FolderKanban className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Project Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        We couldn't find the project you're looking for. It may have been deleted, or you might not have access to it anymore.
      </p>
      <Link 
        href="/dashboard"
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  );
}
