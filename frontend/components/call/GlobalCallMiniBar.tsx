"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Phone,
} from "lucide-react";
import { useCallStore } from "@/lib/store/callStore";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";

export function GlobalCallMiniBar() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    callId,
    projectId,
    callStatus,
    statusText,
    remoteUser,
    durationSeconds,
    callType,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    endActiveCall,
  } = useCallStore();

  // Format seconds to mm:ss or hh:mm:ss
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${remMins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Only show mini bar if call is active and user is NOT on the specific call page
  const isCallPage =
    projectId && pathname === `/dashboard/projects/${projectId}/call`;
  const isCallActive =
    callStatus === "connected" ||
    callStatus === "calling" ||
    callStatus === "ringing" ||
    callStatus === "reconnecting";

  if (!isCallActive || isCallPage) {
    return null;
  }

  const handleExpand = () => {
    if (projectId) {
      router.push(`/dashboard/projects/${projectId}/call`);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#090d20]/90 border border-white/[0.12] shadow-2xl backdrop-blur-xl select-none"
      >
        {/* Status indicator & Avatar */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleExpand}>
          <div className="relative">
            <UserAvatar
              src={remoteUser?.avatar}
              name={remoteUser?.name || "Member"}
              size="sm"
              className="w-7 h-7 ring-2 ring-violet-500/40"
            />
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#090d20]",
                callStatus === "connected"
                  ? "bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"
                  : callStatus === "reconnecting"
                  ? "bg-amber-500 animate-ping"
                  : "bg-violet-500 animate-pulse"
              )}
            />
          </div>

          <div className="min-w-0 pr-1">
            <p className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[180px]">
              {remoteUser?.name || "SprintForge Call"}
            </p>
            <p className="text-[10px] font-mono text-slate-400">
              {callStatus === "connected"
                ? formatDuration(durationSeconds)
                : statusText || "Connecting..."}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/[0.1]" />

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Mute toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className={cn(
              "p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer",
              isMuted
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white"
            )}
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          {/* Video toggle */}
          {callType === "video" && (
            <button
              type="button"
              onClick={toggleVideo}
              className={cn(
                "p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer",
                isVideoOff
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white"
              )}
              title={isVideoOff ? "Turn camera on" : "Turn camera off"}
            >
              {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Expand to full workspace */}
          <button
            type="button"
            onClick={handleExpand}
            className="p-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:text-white transition-colors cursor-pointer"
            title="Expand to full call workspace"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* End Call */}
          <button
            type="button"
            onClick={endActiveCall}
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-md shadow-rose-600/30"
            title="End call"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
