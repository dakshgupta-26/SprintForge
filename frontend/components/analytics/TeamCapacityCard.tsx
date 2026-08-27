"use client";

import React from "react";
import { Users2, CheckCircle2, Flame, Scale } from "lucide-react";
import { generateAvatar, cn } from "@/lib/utils";

interface TeamCapacityCardProps {
  teamData: any[];
}

export function TeamCapacityCard({ teamData = [] }: TeamCapacityCardProps) {
  const hasData = teamData.length > 0;
  const totalPoints = teamData.reduce((sum, m) => sum + (m.storyPoints || 0), 0);

  // Derive workload balance insight
  let balanceStatus = {
    label: "Balanced",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    text: "Workload is distributed evenly across active contributors.",
  };

  if (teamData.length > 1 && totalPoints > 0) {
    const maxMemberPoints = Math.max(...teamData.map((m) => m.storyPoints || 0));
    const highestRatio = maxMemberPoints / totalPoints;
    if (highestRatio >= 0.5) {
      balanceStatus = {
        label: "Skewed",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        text: `One contributor owns ${Math.round(highestRatio * 100)}% of active story points.`,
      };
    }
  }

  return (
    <div className="p-6 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-lg flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
            Capacity
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Team Workload & Velocity
          </h2>
        </div>

        {hasData && (
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border", balanceStatus.color)}>
              {balanceStatus.label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {!hasData ? (
        <div className="h-52 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.06] rounded-2xl text-xs text-slate-500">
          No team assignment data recorded yet.
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {teamData.map((member) => {
            const completionPct =
              member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
            return (
              <div key={member._id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={member.avatar || generateAvatar(member.name || "U")}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover border border-white/[0.1]"
                    />
                    <span className="font-bold text-white truncate max-w-[120px]">
                      {member.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-slate-400 text-[11px]">
                    {member.storyPoints > 0 && (
                      <span className="text-violet-300 font-bold">
                        {member.storyPoints} SP
                      </span>
                    )}
                    <span>
                      {member.completed}/{member.total} tasks
                    </span>
                    <span className="text-emerald-400 font-bold w-9 text-right">
                      {completionPct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                    title={`${member.completed} completed`}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{
                      width: `${member.total > 0 ? (member.inProgress / member.total) * 100 : 0}%`,
                    }}
                    title={`${member.inProgress} in progress`}
                  />
                </div>
              </div>
            );
          })}

          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-white/[0.04]">
            💡 {balanceStatus.text}
          </p>
        </div>
      )}
    </div>
  );
}
