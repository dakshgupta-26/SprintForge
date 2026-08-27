"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Laptop,
  Check,
  Sparkles,
  Sliders,
  Eye,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export function PreferencesTab() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [motionSetting, setMotionSetting] = useState<"full" | "reduced">("full");
  const [lastSaved, setLastSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedDensity = localStorage.getItem("sf_density") as any;
    if (savedDensity) setDensity(savedDensity);
    const savedMotion = localStorage.getItem("sf_motion") as any;
    if (savedMotion) setMotionSetting(savedMotion);
  }, []);

  const handleDensityChange = (val: "comfortable" | "compact") => {
    setDensity(val);
    localStorage.setItem("sf_density", val);
    triggerSavedNotice();
  };

  const handleMotionChange = (val: "full" | "reduced") => {
    setMotionSetting(val);
    localStorage.setItem("sf_motion", val);
    triggerSavedNotice();
  };

  const triggerSavedNotice = () => {
    setLastSaved(true);
    setTimeout(() => setLastSaved(false), 2000);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* ── 1. Appearance & Theme ── */}
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
              Appearance & Theme
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize how SprintForge looks on your device.
            </p>
          </div>
          {lastSaved && (
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => {
              setTheme("dark");
              triggerSavedNotice();
            }}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 relative overflow-hidden group",
              theme === "dark"
                ? "bg-violet-600/15 border-violet-500/50 shadow-md"
                : "bg-[#060914] border-white/[0.06] hover:border-white/[0.14]"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              {theme === "dark" && (
                <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-white">Dark Mode</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Engineered for low-light coding environments.
              </p>
            </div>
          </button>

          {/* Light Mode */}
          <button
            type="button"
            onClick={() => {
              setTheme("light");
              triggerSavedNotice();
            }}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 relative overflow-hidden group",
              theme === "light"
                ? "bg-violet-600/15 border-violet-500/50 shadow-md"
                : "bg-[#060914] border-white/[0.06] hover:border-white/[0.14]"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              {theme === "light" && (
                <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-white">Light Mode</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                High-contrast daylight theme.
              </p>
            </div>
          </button>

          {/* System Default */}
          <button
            type="button"
            onClick={() => {
              setTheme("system");
              triggerSavedNotice();
            }}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 relative overflow-hidden group",
              theme === "system"
                ? "bg-violet-600/15 border-violet-500/50 shadow-md"
                : "bg-[#060914] border-white/[0.06] hover:border-white/[0.14]"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              {theme === "system" && (
                <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-white">System Sync</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Automatically match your OS theme.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ── 2. Interface Density & View Modes ── */}
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
            Interface Density
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Adjust table row spacing and Kanban card information density.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleDensityChange("comfortable")}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5",
              density === "comfortable"
                ? "bg-violet-600/15 border-violet-500/50"
                : "bg-[#060914] border-white/[0.06] hover:border-white/[0.12]"
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-slate-300 flex-shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white">Comfortable (Default)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Standard padding with optimal visual breathing room.
              </p>
            </div>
            {density === "comfortable" && (
              <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDensityChange("compact")}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5",
              density === "compact"
                ? "bg-violet-600/15 border-violet-500/50"
                : "bg-[#060914] border-white/[0.06] hover:border-white/[0.12]"
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-slate-300 flex-shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white">Compact (Power User)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Dense layout showing more tasks per viewport height.
              </p>
            </div>
            {density === "compact" && (
              <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* ── 3. Motion & Animation Physics ── */}
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
            Motion & Transitions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure layout transitions and Framer Motion animations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleMotionChange("full")}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5",
              motionSetting === "full"
                ? "bg-violet-600/15 border-violet-500/50"
                : "bg-[#060914] border-white/[0.06] hover:border-white/[0.12]"
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-slate-300 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white">Full Motion (Spring Physics)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Rich drag-and-drop springs, slide overs, and smooth transitions.
              </p>
            </div>
            {motionSetting === "full" && (
              <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleMotionChange("reduced")}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5",
              motionSetting === "reduced"
                ? "bg-violet-600/15 border-violet-500/50"
                : "bg-[#060914] border-white/[0.06] hover:border-white/[0.12]"
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-slate-300 flex-shrink-0">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white">Reduced Motion</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Instant UI updates with minimal animation for performance.
              </p>
            </div>
            {motionSetting === "reduced" && (
              <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
