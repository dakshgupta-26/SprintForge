"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsMetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: string;
    isPositive?: boolean; // True if good (green), False if bad (rose)
    isNeutral?: boolean;
  };
  icon: LucideIcon;
  color: string;
  bg: string;
  description: string;
}

export function AnalyticsMetricCard({
  label,
  value,
  subValue,
  trend,
  icon: Icon,
  color,
  bg,
  description,
}: AnalyticsMetricCardProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      onMouseEnter={() => setShowInfo(true)}
      onMouseLeave={() => setShowInfo(false)}
      className="relative p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] hover:border-white/[0.15] transition-all shadow-sm group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105", bg, color)}>
            <Icon className="w-4 h-4" />
          </div>

          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border",
                trend.isNeutral
                  ? "text-slate-400 bg-white/[0.04] border-white/[0.06]"
                  : trend.isPositive
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : "text-rose-400 bg-rose-500/10 border-rose-500/20"
              )}
            >
              {trend.isNeutral ? (
                <Minus className="w-3 h-3" />
              ) : trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {value}
          </span>
          {subValue && (
            <span className="text-xs font-mono text-slate-500">{subValue}</span>
          )}
        </div>

        <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mt-1">
          {label}
        </p>
      </div>

      {/* Tooltip / Definition popup */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute left-4 right-4 bottom-3 p-2.5 rounded-xl bg-[#060914] border border-white/[0.12] text-[11px] text-slate-300 shadow-xl z-20 pointer-events-none"
          >
            {description}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
