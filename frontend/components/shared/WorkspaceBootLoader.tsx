"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Check,
  RotateCcw,
  ArrowLeft,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SprintForgeLogo } from "@/components/shared/SprintForgeLogo";
import { WorkspaceSignal } from "./WorkspaceSignal";

export interface WorkspaceStage {
  id: string;
  label: string;
  completedLabel?: string;
}

export interface WorkspaceBootLoaderProps {
  variant?: "fullscreen" | "embedded" | "compact";
  title?: string;
  subtitle?: string;
  stages?: WorkspaceStage[];
  currentStageIndex?: number;
  status?: "loading" | "ready" | "error";
  statusMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
  showNetworkSlowHint?: boolean;
  timeoutSlowMs?: number;
  timeoutVerySlowMs?: number;
}

const DEFAULT_STAGES: WorkspaceStage[] = [
  { id: "connect", label: "Connecting to workspace", completedLabel: "Connected to workspace" },
  { id: "project", label: "Loading project data", completedLabel: "Project verified" },
  { id: "presence", label: "Loading team presence", completedLabel: "Team synchronized" },
  { id: "sync", label: "Preparing realtime workspace", completedLabel: "Workspace ready" },
];

export function WorkspaceBootLoader({
  variant = "embedded",
  title = "SprintForge",
  subtitle = "PROJECT WORKSPACE",
  stages = DEFAULT_STAGES,
  currentStageIndex = 0,
  status = "loading",
  statusMessage,
  errorTitle = "Workspace couldn't be loaded",
  errorMessage = "Something went wrong while connecting to SprintForge.",
  onRetry,
  onBack,
  className,
  showNetworkSlowHint = true,
  timeoutSlowMs = 3500,
  timeoutVerySlowMs = 7500,
}: WorkspaceBootLoaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const [slowHintLevel, setSlowHintLevel] = useState<0 | 1 | 2>(0);

  // Slow network progressive updates
  useEffect(() => {
    if (status !== "loading" || !showNetworkSlowHint) {
      setSlowHintLevel(0);
      return;
    }

    const t1 = setTimeout(() => {
      setSlowHintLevel(1);
    }, timeoutSlowMs);

    const t2 = setTimeout(() => {
      setSlowHintLevel(2);
    }, timeoutVerySlowMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [status, showNetworkSlowHint, timeoutSlowMs, timeoutVerySlowMs]);

  // Derive active human-friendly status line
  const activeStage = stages[Math.min(currentStageIndex, stages.length - 1)];
  const currentStatusText =
    statusMessage ||
    (status === "error"
      ? errorTitle
      : status === "ready"
      ? "Workspace ready"
      : slowHintLevel === 2
      ? "Taking a little longer than usual..."
      : slowHintLevel === 1
      ? "Still preparing your workspace..."
      : activeStage?.label || "Preparing your workspace...");

  const isFullscreen = variant === "fullscreen";
  const isCompact = variant === "compact";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden select-none",
        isFullscreen && "fixed inset-0 z-50 min-h-screen w-full bg-[#050811]",
        variant === "embedded" &&
          "w-full h-full min-h-[480px] bg-[#070a14] rounded-2xl sm:rounded-3xl border border-white/[0.08] p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]",
        isCompact &&
          "w-full min-h-[320px] bg-[#070a14] rounded-2xl border border-white/[0.08] p-4 sm:p-6",
        className
      )}
    >
      {/* ─── Ambient Atmospheric Background Glow ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Faint Radial Violet Atmospheric Lighting */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[340px] rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, rgba(99, 102, 241, 0.2) 50%, transparent 70%)",
          }}
        />

        {/* Subtle Engineering Grid Overlay */}
        <div className="absolute inset-0 bg-grid-faint opacity-15 pointer-events-none" />

        {/* Soft moving light shimmer */}
        {!shouldReduceMotion && (
          <motion.div
            className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] opacity-5 pointer-events-none"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              background:
                "conic-gradient(from 0deg at 50% 50%, rgba(139,92,246,0.3) 0deg, transparent 60deg, transparent 300deg, rgba(6,182,212,0.3) 360deg)",
            }}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === "error" ? (
          /* ─── Polished Error State ─── */
          <motion.div
            key="error-state"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 flex flex-col items-center text-center max-w-sm px-4"
          >
            {/* Warning Badge */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(245,158,11,0.15)]">
              <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-2 font-display">
              {errorTitle}
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              {errorMessage}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.05] border border-white/10 hover:bg-white/[0.09] hover:text-white transition-all active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Go back
                </button>
              )}

              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(124,92,255,0.35)] transition-all active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try again
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          /* ─── Animated Boot Sequence ─── */
          <motion.div
            key="boot-sequence"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.18 } }}
            className="relative z-10 flex flex-col items-center w-full max-w-md px-4"
          >
            {/* ─── Branding Header ─── */}
            <div className="flex flex-col items-center text-center mb-3 sm:mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <SprintForgeLogo variant="icon" size="sm" />
                <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-violet-300/90 uppercase">
                  {title}
                </span>
              </div>
              <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                {subtitle}
              </div>
            </div>

            {/* ─── Animated Workspace Signal Node Network ─── */}
            <div className="my-1 sm:my-2">
              <WorkspaceSignal
                activeStageIndex={currentStageIndex}
                status={status}
                compact={isCompact}
              />
            </div>

            {/* ─── Live Dynamic Status Message ─── */}
            <div className="h-6 flex items-center justify-center my-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStatusText}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs sm:text-sm font-medium text-slate-200 tracking-wide text-center flex items-center gap-1.5"
                >
                  {status === "ready" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      Workspace ready
                    </span>
                  ) : slowHintLevel >= 1 ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-300/90">
                      <Clock className="w-3.5 h-3.5 text-amber-400/80 animate-spin" style={{ animationDuration: "6s" }} />
                      {currentStatusText}
                    </span>
                  ) : (
                    <span>{currentStatusText}</span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ─── Progressive Stage Stepper ─── */}
            {!isCompact && stages.length > 0 && (
              <div className="w-full max-w-xs mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
                {stages.map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex || status === "ready";
                  const isActive = idx === currentStageIndex && status === "loading";
                  const isPending = idx > currentStageIndex && status !== "ready";

                  return (
                    <motion.div
                      key={stage.id}
                      initial={false}
                      animate={{
                        opacity: isPending ? 0.4 : 1,
                      }}
                      className="flex items-center justify-between py-1 text-xs transition-opacity duration-300"
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Status Glyph */}
                        <div className="relative flex items-center justify-center w-4 h-4 flex-shrink-0">
                          {isCompleted ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                              className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400"
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </motion.div>
                          ) : isActive ? (
                            <div className="relative flex items-center justify-center">
                              {!shouldReduceMotion && (
                                <motion.span
                                  className="absolute w-3.5 h-3.5 rounded-full bg-violet-500/30"
                                  animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                />
                              )}
                              <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                            </div>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                          )}
                        </div>

                        {/* Stage Label */}
                        <span
                          className={cn(
                            "font-sans transition-colors duration-200",
                            isCompleted && "text-slate-300",
                            isActive && "text-white font-medium",
                            isPending && "text-slate-500"
                          )}
                        >
                          {isCompleted ? stage.completedLabel || stage.label : stage.label}
                        </span>
                      </div>

                      {/* Small subtle status pill on right */}
                      {isCompleted ? (
                        <span className="font-mono text-[9px] text-emerald-400/80 uppercase tracking-wider font-semibold">
                          Done
                        </span>
                      ) : isActive ? (
                        <span className="font-mono text-[9px] text-violet-400 uppercase tracking-wider font-semibold animate-pulse">
                          Syncing
                        </span>
                      ) : null}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ─── Slow Network Extended Help ─── */}
            {slowHintLevel === 2 && onRetry && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-[11px] font-medium text-violet-400 hover:text-violet-300 underline underline-offset-4 transition-colors"
                >
                  Reload workspace connection
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
