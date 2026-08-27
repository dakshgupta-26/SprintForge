"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SidebarTooltipProps {
  content: string;
  badge?: number;
  shortcut?: string;
  show: boolean;
  children: React.ReactNode;
}

export function SidebarTooltip({
  content,
  badge,
  shortcut,
  show,
  children,
}: SidebarTooltipProps) {
  if (!show) return <>{children}</>;

  return (
    <div className="relative group flex items-center justify-center w-full">
      {children}
      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden group-hover:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#0e1428] border border-white/[0.14] text-white text-xs font-semibold shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
        <span>{content}</span>
        {badge !== undefined && badge > 0 && (
          <span className="bg-violet-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
            {badge}
          </span>
        )}
        {shortcut && (
          <kbd className="text-[10px] font-mono bg-white/[0.08] text-slate-300 px-1.5 py-0.5 rounded border border-white/[0.1]">
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
}
