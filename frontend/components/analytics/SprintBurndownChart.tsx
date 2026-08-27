"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Zap, Calendar, TrendingDown, Info } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface SprintBurndownChartProps {
  sprint: any;
  burndownData: any;
  sprints: any[];
  onSelectSprint: (sprintId: string) => void;
}

export function SprintBurndownChart({
  sprint,
  burndownData,
  sprints,
  onSelectSprint,
}: SprintBurndownChartProps) {
  const chartData = burndownData?.data || [];
  const hasData = chartData.length > 0;

  return (
    <div className="p-6 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-lg flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
              Burn Rate
            </span>
            {sprint && (
              <span
                className={cn(
                  "text-[10px] font-mono font-bold uppercase px-2 py-0.2 rounded-full",
                  sprint.status === "active"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/[0.04] text-slate-400 border border-white/[0.06]"
                )}
              >
                {sprint.status}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Sprint Burndown
          </h2>
          {sprint && (
            <p className="text-xs font-mono text-slate-400">
              {sprint.name} • {formatDate(sprint.startDate, "short")} →{" "}
              {formatDate(sprint.endDate, "short")}
            </p>
          )}
        </div>

        {/* Sprint Selector */}
        {sprints.length > 0 && (
          <select
            value={sprint?._id || ""}
            onChange={(e) => onSelectSprint(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            {sprints.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Chart Canvas */}
      {!hasData ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.06] rounded-2xl">
          <Zap className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-300">No active sprint burndown</p>
          <p className="text-xs text-slate-500 max-w-xs mt-0.5">
            Start a sprint with story points to track your remaining burn trajectory.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="remainingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7c5cff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "#64748b", fontFamily: "monospace" }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748b", fontFamily: "monospace" }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#090d1f",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 16,
                  fontSize: 12,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                  color: "#ffffff",
                }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 10, fontFamily: "monospace" }}
              />
              <Area
                type="monotone"
                dataKey="remaining"
                name="Remaining SP"
                stroke="#7c5cff"
                fill="url(#remainingGrad)"
                strokeWidth={2.5}
              />
              <Line
                type="monotone"
                dataKey="ideal"
                name="Ideal Burn"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
