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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 320 }}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.12] bg-[#070b1a]/95 p-6 shadow-2xl backdrop-blur-xl text-center"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />

          {/* Call Type Header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-300">
              Incoming {isVideo ? "Video" : "Audio"} Call
            </span>
          </div>

          {/* Caller Avatar with Pulse Waves */}
          <div className="relative mx-auto my-4 flex items-center justify-center w-28 h-28">
            <motion.div
              animate={{
                scale: [1, 1.25, 1.4],
                opacity: [0.6, 0.25, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="absolute inset-0 rounded-full bg-violet-500/20 border border-violet-400/40"
            />
            <motion.div
              animate={{
                scale: [1, 1.15, 1.25],
                opacity: [0.8, 0.4, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.4,
              }}
              className="absolute inset-1 rounded-full bg-violet-500/30 border border-violet-400/50"
            />

            <UserAvatar
              src={incomingCall.caller.avatar}
              name={incomingCall.caller.name}
              size="2xl"
              className="w-24 h-24 text-2xl shadow-xl ring-4 ring-violet-500/40"
            />
          </div>

          {/* Caller Details */}
          <div className="mt-4 space-y-1">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {incomingCall.caller.name}
            </h3>
            <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 font-mono text-[10px]">
                {incomingCall.projectName || "SprintForge"}
              </span>
              <span>•</span>
              <span className="text-violet-400">{incomingCall.caller.role || "Member"}</span>
            </p>
          </div>

          {/* Active Call Conflict Warning */}
          {showConflictWarning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2 text-left"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              <span>
                Accepting this call will end your current call
                {remoteUser?.name ? ` with ${remoteUser.name}` : ""}.
              </span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-center gap-4">
            {/* Decline */}
            <button
              type="button"
              onClick={() => rejectIncomingCall(incomingCall.callId, "Call declined")}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-sm transition-all active:scale-95 cursor-pointer shadow-lg hover:shadow-rose-950/50"
              title="Decline call (Esc)"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Decline</span>
            </button>

            {/* Accept */}
            <button
              type="button"
              onClick={() => acceptIncomingCall(incomingCall.callId)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
              title="Accept call (Enter)"
            >
              {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              <span>Accept</span>
            </button>
          </div>

          <p className="mt-4 text-[11px] text-slate-500 font-mono">
            Press <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-slate-400">Enter</kbd> to accept or{" "}
            <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-slate-400">Esc</kbd> to decline
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
