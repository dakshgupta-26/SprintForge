"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, AlertTriangle } from "lucide-react";
import { useCallStore } from "@/lib/store/callStore";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";

export function IncomingCallModal() {
  const {
    incomingCall,
    showConflictWarning,
    remoteUser,
    callStatus,
    acceptIncomingCall,
    rejectIncomingCall,
  } = useCallStore();

  // Keyboard shortcut listener: Enter to accept, Escape to decline
  useEffect(() => {
    if (!incomingCall) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        acceptIncomingCall(incomingCall.callId);
      } else if (e.key === "Escape") {
        e.preventDefault();
        rejectIncomingCall(incomingCall.callId, "Call declined by receiver");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [incomingCall, acceptIncomingCall, rejectIncomingCall]);

  if (!incomingCall) return null;

  const isVideo = incomingCall.type === "video";

  return (
    <AnimatePresence>
      <div className="fixed top-5 right-5 sm:right-6 z-50 max-w-sm w-[calc(100vw-40px)] sm:w-96 pointer-events-auto select-none">
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.94 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-[#080c1d]/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-left"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-violet-600/25 rounded-full blur-2xl pointer-events-none" />

          {/* Top Pill / Call Type Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-[11px] font-mono font-bold tracking-wide uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Incoming {isVideo ? "Video" : "Audio"} Call</span>
            </div>

            {incomingCall.projectName && (
              <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06] truncate max-w-[130px]">
                {incomingCall.projectName}
              </span>
            )}
          </div>

          {/* Caller Profile Header */}
          <div className="flex items-center gap-3.5 my-2">
            {/* Animated Pulse Avatar */}
            <div className="relative flex-shrink-0 flex items-center justify-center w-14 h-14">
              <motion.div
                animate={{
                  scale: [1, 1.28, 1.45],
                  opacity: [0.6, 0.25, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 rounded-full bg-violet-500/25 border border-violet-400/40"
              />
              <UserAvatar
                src={incomingCall.caller.avatar}
                name={incomingCall.caller.name}
                size="lg"
                className="w-12 h-12 text-base shadow-xl ring-2 ring-violet-500/50"
              />
            </div>

            {/* Name & Role */}
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-white truncate tracking-tight">
                {incomingCall.caller.name}
              </h3>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <span className="text-violet-300 font-medium">
                  {incomingCall.caller.role || "Team Member"}
                </span>
                <span>•</span>
                <span className="text-slate-400">Calling you...</span>
              </p>
            </div>
          </div>

          {/* Active Call Conflict Warning */}
          {showConflictWarning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2"
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
              <span className="text-[11px] leading-tight">
                Accepting will replace your active call
                {remoteUser?.name ? ` with ${remoteUser.name}` : ""}.
              </span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="mt-5 flex items-center gap-2.5">
            {/* Decline */}
            <button
              type="button"
              onClick={() => rejectIncomingCall(incomingCall.callId, "Call declined")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-all active:scale-95 cursor-pointer shadow-md hover:shadow-rose-950/40"
              title="Decline call (Esc)"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Decline</span>
            </button>

            {/* Accept */}
            <button
              type="button"
              onClick={() => acceptIncomingCall(incomingCall.callId)}
              className="flex-[1.4] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
              title="Accept call (Enter)"
            >
              {isVideo ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              <span>Accept {isVideo ? "Video" : "Audio"}</span>
            </button>
          </div>

          <div className="mt-3 text-[10px] text-slate-500 font-mono text-center flex items-center justify-center gap-2">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-slate-300">Enter</kbd> to accept</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-slate-300">Esc</kbd> to decline</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
}
