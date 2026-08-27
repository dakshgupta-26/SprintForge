"use client";

import React, { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Sparkles, Layers, Bug, Flame, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkDistributionCardProps {
  typeDist: any[];
  priorityDist: any[];
}

const TYPE_COLORS: Record<string, string> = {
  story: "#a855f7",
  task: "#3b82f6",
  bug: "#f43f5e",
  epic: "#f59e0b",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#f43f5e",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#64748b",
};

export function WorkDistributionCard({
  typeDist = [],
  priorityDist = [],
}: WorkDistributionCardProps) {
  const [view, setView] = useState<"type" | "priority">("type");

  const currentDist = view === "type" ? typeDist : priorityDist;
  const totalCount = currentDist.reduce((sum, item) => sum + item.count, 0);

  const chartData = currentDist.map((item) => ({
    name: item._id?.toUpperCase() || "UNSPECIFIED",
    rawId: item._id,
    value: item.count,
    points: item.points || 0,
  }));

  const getColor = (rawId: string) => {
    if (view === "type") return TYPE_COLORS[rawId] || "#7c5cff";
    return PRIORITY_COLORS[rawId] || "#7c5cff";
  };

  return (
    <div className="p-6 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-lg flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
            Effort Allocation
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Work Distribution
          </h2>
        </div>

        {/* Toggle */}
        <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#060914] p-0.5">
          <button
            onClick={() => setView("type")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
              view === "type"
                ? "bg-white/[0.08] text-white"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            Type
          </button>
          <button
            onClick={() => setView("priority")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
              view === "priority"
                ? "bg-white/[0.08] text-white"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            Priority
          </button>
        </div>
      </div>

      {/* Content */}
      {totalCount === 0 ? (
        <div className="h-52 flex items-center justify-center text-center p-6 border border-dashed border-white/[0.06] rounded-2xl text-xs text-slate-500">
          No tasks available to calculate distribution
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          {/* Donut */}
          <div className="w-40 h-40 flex-shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={70}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={getColor(entry.rawId)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#090d1f",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    fontSize: 11,
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-white">{totalCount}</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase -mt-1">
                Tasks
              </span>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="flex-1 space-y-2 w-full">
            {chartData.map((item) => {
              const pct = totalCount > 0 ? Math.round((item.value / totalCount) * 100) : 0;
              const color = getColor(item.rawId);
              return (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-white uppercase text-[11px] font-mono">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-slate-400">
                    <span>{item.value} tasks</span>
                    <span className="font-bold text-white w-9 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
