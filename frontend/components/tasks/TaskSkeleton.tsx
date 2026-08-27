"use client";

import React from "react";

export function TaskSkeleton() {
  return (
    <div className="space-y-2.5 w-full">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-14 rounded-2xl bg-[#090d1f] border border-white/[0.06] animate-pulse p-3.5 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 flex-1">
            <div className="w-5 h-5 rounded-md bg-white/[0.04]" />
            <div className="w-16 h-3.5 rounded bg-white/[0.04]" />
            <div className="w-64 h-4 rounded bg-white/[0.06]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-4 rounded bg-white/[0.03]" />
            <div className="w-14 h-4 rounded bg-white/[0.04]" />
            <div className="w-16 h-4 rounded bg-white/[0.03]" />
          </div>
        </div>
      ))}
    </div>
  );
}
