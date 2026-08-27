"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, Layers, CheckCircle2 } from "lucide-react";

interface VelocityTrendChartProps {
  velocityData: any[];
}

export function VelocityTrendChart({ velocityData = [] }: VelocityTrendChartProps) {
  const hasData = velocityData.length > 0;
  const avgVelocity = hasData
    ? Math.round(
        velocityData.reduce((sum, v) => sum + (v.completed || 0), 0) / velocityData.length
      )
    : 0;

  return (
    <div className="p-6 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-lg flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
            Sprint History
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Velocity Trend
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Historical planned vs completed story points
          </p>
        </div>

        {hasData && (
          <div className="text-right">
            <span className="text-xl font-black text-white font-mono">
              {avgVelocity} <span className="text-xs text-slate-400 font-sans">avg SP</span>
            </span>
          </div>
        )}
      </div>

      {/* Canvas */}
      {!hasData ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.06] rounded-2xl">
          <Layers className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-300">No completed sprints yet</p>
          <p className="text-xs text-slate-500 max-w-xs mt-0.5">
            Complete your active sprints to generate velocity and predictability analytics.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="name"
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
              <Bar dataKey="planned" name="Planned SP" fill="#475569" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" name="Completed SP" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
