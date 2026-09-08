"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CodeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;

  useEffect(() => {
    // Log client error diagnostics
    console.error("[SprintForge Code Workspace Error]:", error);
  }, [error]);

  return (
    <div className="w-full h-[calc(100vh-80px)] bg-[#070a18] flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-md bg-[#090d22] border border-red-500/20 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-200 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>

        <div>
          <h2 className="text-base font-bold text-white tracking-wide">
            Code Workspace Encountered an Error
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            The code workspace ran into an unexpected runtime state. You can try
            re-initializing the workspace or returning to the project dashboard.
          </p>
        </div>

        {error.message && (
          <div className="text-left bg-black/40 border border-red-500/15 rounded-xl p-3 text-[11px] font-mono text-red-300/90 break-words max-h-28 overflow-y-auto">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={reset}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Retry Workspace
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Full Reload
          </button>
          {projectId && (
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-slate-400 hover:text-slate-200 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Project Hub
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
