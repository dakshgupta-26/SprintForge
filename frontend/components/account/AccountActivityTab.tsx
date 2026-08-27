"use client";

import React from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import {
  Clock,
  Shield,
  FolderKanban,
  UserCheck,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export function AccountActivityTab() {
  const { user } = useAuthStore();
  const { projects } = useProjectStore();

  const createdAt = user?.createdAt ? new Date(user.createdAt) : new Date();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
            Security & Account Audit Trail
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological record of key events and access permissions for your account.
          </p>
        </div>

        {/* Activity Timeline */}
        <div className="relative pl-6 border-l border-white/[0.08] space-y-6">
          {/* 1. Active Session */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Active Session Authenticated</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Signed in via {user?.provider === "google" ? "Google SSO" : "Email & Password"}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Just now</p>
            </div>
          </div>

          {/* 2. Workspace Access */}
          {projects.length > 0 && (
            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-violet-500/20 border-2 border-violet-500 flex items-center justify-center">
                <FolderKanban className="w-2.5 h-2.5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Workspace Access Granted</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Member of {projects.map((p) => p.name).join(", ")}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Active workspaces ({projects.length})
                </p>
              </div>
            </div>
          )}

          {/* 3. Account Provisioned */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
              <UserCheck className="w-2.5 h-2.5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Account Provisioned</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                SprintForge account created for {user?.email}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                {format(createdAt, "MMMM d, yyyy · h:mm a")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
