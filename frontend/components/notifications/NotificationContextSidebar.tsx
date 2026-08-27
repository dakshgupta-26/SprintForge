"use client";

import React from "react";
import Link from "next/link";
import {
  FolderKanban,
  Columns3,
  AlignLeft,
  Bug,
  MessageSquare,
  Users,
  Zap,
  AtSign,
  CheckCircle2,
  Settings,
  ArrowRight,
  ShieldCheck,
  Bell,
  Sparkles,
} from "lucide-react";
import { useProjectStore } from "@/lib/store/projectStore";
import { cn } from "@/lib/utils";

interface NotificationContextSidebarProps {
  total: number;
  unread: number;
  taskCount: number;
  mentionCount: number;
  inviteCount: number;
  issueCount: number;
  onOpenPreferences: () => void;
  onMarkAllRead: () => void;
}

export function NotificationContextSidebar({
  total,
  unread,
  taskCount,
  mentionCount,
  inviteCount,
  issueCount,
  onOpenPreferences,
  onMarkAllRead,
}: NotificationContextSidebarProps) {
  const { projects, currentProject } = useProjectStore();
  const activeProject = currentProject || projects[0];

  const distribution = [
    { label: "Tasks & Sprints", count: taskCount, color: "bg-amber-400" },
    { label: "Mentions & Comments", count: mentionCount, color: "bg-pink-400" },
    { label: "Invitations & Team", count: inviteCount, color: "bg-violet-400" },
    { label: "Bug Issues", count: issueCount, color: "bg-rose-400" },
  ];

  return (
    <div className="space-y-4">
      {/* ── 1. Workspace Project Context Card ── */}
      {activeProject ? (
        <div className="p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FolderKanban className="w-3 h-3 text-violet-400" /> Active Workspace
            </span>
            <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.2 rounded">
              {activeProject.key}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md"
              style={{ backgroundColor: activeProject.color || "#6366f1" }}
            >
              {activeProject.key?.charAt(0) || "P"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {activeProject.name}
              </p>
              <p className="text-xs text-slate-400 font-mono">
                {activeProject.members?.length || 1} members • {activeProject.type}
              </p>
            </div>
          </div>

          {/* Direct Workspace Navigation Shortcuts */}
          <div className="pt-2 border-t border-white/[0.06] space-y-1">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold mb-1.5">
              Quick Jump
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                href={`/dashboard/projects/${activeProject._id}/board`}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <Columns3 className="w-3.5 h-3.5 text-violet-400" />
                <span className="truncate">Board</span>
              </Link>
              <Link
                href={`/dashboard/projects/${activeProject._id}/backlog`}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <AlignLeft className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">Backlog</span>
              </Link>
              <Link
                href={`/dashboard/projects/${activeProject._id}/issues`}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <Bug className="w-3.5 h-3.5 text-rose-400" />
                <span className="truncate">Issues</span>
              </Link>
              <Link
                href={`/dashboard/projects/${activeProject._id}/chat`}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">Chat</span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── 2. Activity Distribution Breakdown ── */}
      <div className="p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Activity Breakdown
          </span>
          <span className="text-xs font-mono font-bold text-slate-400">
            {total} total
          </span>
        </div>

        <div className="space-y-2.5">
          {distribution.map((item) => {
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300 text-[11px]">{item.label}</span>
                  <span className="text-slate-400 text-[11px] font-mono">
                    {item.count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-300", item.color)}
                    style={{ width: `${Math.max(percentage, item.count > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Quick Actions & Preferences Card ── */}
      <div className="p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-sm space-y-3">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
          Preferences & Controls
        </span>
        <div className="space-y-2">
          {unread > 0 && (
            <button
              onClick={onMarkAllRead}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 text-xs font-bold text-violet-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                <span>Mark All Read</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenPreferences}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Configure Alerts</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
