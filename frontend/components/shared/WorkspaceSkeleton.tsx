"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function ChatSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full h-full min-h-[500px] flex bg-[#070a14] rounded-2xl sm:rounded-3xl border border-white/[0.08] overflow-hidden select-none",
        className
      )}
    >
      {/* Messages Column Skeleton */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="h-16 border-b border-white/[0.06] px-6 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-32 h-3 rounded-full bg-white/[0.08] animate-pulse" />
              <div className="w-20 h-2 rounded-full bg-white/[0.04] animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] animate-pulse" />
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] animate-pulse" />
          </div>
        </div>

        {/* Message Bubbles Skeleton */}
        <div className="flex-1 p-6 space-y-5 overflow-hidden">
          {/* Incoming message */}
          <div className="flex items-start gap-3 max-w-md">
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] animate-pulse flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="w-24 h-2.5 rounded bg-white/[0.08] animate-pulse" />
              <div className="h-14 rounded-2xl bg-white/[0.04] border border-white/[0.04] p-3 animate-pulse" />
            </div>
          </div>

          {/* Outgoing message */}
          <div className="flex items-start justify-end gap-3 ml-auto max-w-md">
            <div className="space-y-1.5 flex-1 flex flex-col items-end">
              <div className="w-16 h-2.5 rounded bg-white/[0.08] animate-pulse" />
              <div className="h-10 w-48 rounded-2xl bg-violet-600/10 border border-violet-500/20 p-3 animate-pulse" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 animate-pulse flex-shrink-0" />
          </div>

          {/* Incoming message with attachment preview */}
          <div className="flex items-start gap-3 max-w-lg">
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] animate-pulse flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-28 h-2.5 rounded bg-white/[0.08] animate-pulse" />
              <div className="h-24 rounded-2xl bg-white/[0.04] border border-white/[0.04] p-3 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Textarea Input Bar Skeleton */}
        <div className="p-4 border-t border-white/[0.06] bg-[#090d1c]/50">
          <div className="h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ProjectHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 select-none", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.06] animate-pulse" />
          <div className="space-y-1.5">
            <div className="w-48 h-4 rounded-full bg-white/[0.08] animate-pulse" />
            <div className="w-32 h-2.5 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-8 rounded-xl bg-white/[0.05] animate-pulse" />
          <div className="w-28 h-8 rounded-xl bg-violet-600/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
