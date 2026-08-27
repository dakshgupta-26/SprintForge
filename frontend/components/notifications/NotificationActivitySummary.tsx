"use client";

import React from "react";
import { Bell, Zap, AtSign, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationActivitySummaryProps {
  total: number;
  unread: number;
  taskCount: number;
  mentionCount: number;
  inviteCount: number;
}

export function NotificationActivitySummary({
  total,
  unread,
  taskCount,
  mentionCount,
  inviteCount,
}: NotificationActivitySummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
      {/* 1. Total Activity */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0d132b] to-[#080d1f] border border-white/[0.08] hover:border-white/[0.16] transition-all shadow-sm flex items-center justify-between group">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Total Activity
          </p>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {total}
          </p>
          <p className="text-[11px] text-slate-500">Across all projects</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform flex-shrink-0">
          <Bell className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Unread Actions */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0d132b] to-[#080d1f] border border-white/[0.08] hover:border-violet-500/30 transition-all shadow-sm flex items-center justify-between group">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Unread Alerts
          </p>
          <p
            className={cn(
              "text-2xl sm:text-3xl font-black tracking-tight",
              unread > 0 ? "text-violet-400" : "text-slate-300"
            )}
          >
            {unread}
          </p>
          <p className="text-[11px] text-slate-500">Requires attention</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform flex-shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Tasks & Sprints */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0d132b] to-[#080d1f] border border-white/[0.08] hover:border-amber-500/30 transition-all shadow-sm flex items-center justify-between group">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Tasks & Sprints
          </p>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {taskCount}
          </p>
          <p className="text-[11px] text-slate-500">Assignments & updates</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform flex-shrink-0">
          <Zap className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Mentions & Invites */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0d132b] to-[#080d1f] border border-white/[0.08] hover:border-pink-500/30 transition-all shadow-sm flex items-center justify-between group">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Mentions & Invites
          </p>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {mentionCount + inviteCount}
          </p>
          <p className="text-[11px] text-slate-500">Collaborator pings</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform flex-shrink-0">
          <AtSign className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
