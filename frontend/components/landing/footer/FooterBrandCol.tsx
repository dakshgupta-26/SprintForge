"use client";

import { useState } from "react";
import Link from "next/link";
import { SprintForgeLogo } from "@/components/shared/SprintForgeLogo";
import { Globe, ShieldCheck, Cpu } from "lucide-react";

export function FooterBrandCol() {
  const [logoHovered, setLogoHovered] = useState(false);

  return (
    <div className="space-y-4">
      {/* Brand Logo with micro-interaction */}
      <div
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
        className="inline-block transition-transform duration-300"
      >
        <SprintForgeLogo href="/" size="md" showBadge={true} badgeText="Agile AI" />
      </div>

      <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
        The modern Agile project management platform for high-velocity engineering teams. Plan sprints, automate velocity insights, and ship with confidence.
      </p>

      {/* Engineering Badges */}
      <div className="space-y-2 pt-1">
        {/* System Status */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>All Systems Operational (99.99%)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1 text-slate-400">
            <Globe className="w-3 h-3 text-violet-400" /> Pune · Engineering HQ
          </span>
          <span>•</span>
          <span className="text-slate-500">CORE v2.4 · BUILD 2026.08</span>
        </div>
      </div>
    </div>
  );
}
