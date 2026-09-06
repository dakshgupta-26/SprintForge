"use client";

import React, { useEffect, useRef } from "react";
import { useCallStore } from "@/lib/store/callStore";

/**
 * GlobalCallAudio: Persistent audio sink mounted at the Dashboard root.
 * Ensures remote WebRTC audio tracks continue playing without interruption
 * regardless of which dashboard page or project tab the user is actively viewing.
 */
export function GlobalCallAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const remoteStream = useCallStore((state) => state.remoteStream);
  const selectedAudioOutputId = useCallStore((state) => state.selectedAudioOutputId);
  const callStatus = useCallStore((state) => state.callStatus);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (remoteStream && (callStatus === "connected" || callStatus === "initiating" || callStatus === "reconnecting")) {
      console.log("[CALL/AUDIO] Attaching remote stream to global audio element:", remoteStream.getAudioTracks().length, "audio tracks");
      if (audioEl.srcObject !== remoteStream) {
        audioEl.srcObject = remoteStream;
      }
      audioEl.play().catch((err) => {
        console.warn("[CALL/AUDIO] Autoplay policy prevented immediate playback. Will resume on user interaction:", err);
      });
    } else {
      audioEl.srcObject = null;
    }
  }, [remoteStream, callStatus]);

  // Support output device selection (speaker switching)
  useEffect(() => {
    const audioEl = audioRef.current as any;
    if (audioEl && selectedAudioOutputId && selectedAudioOutputId !== "default" && typeof audioEl.setSinkId === "function") {
      audioEl.setSinkId(selectedAudioOutputId).catch((err: any) => {
        console.warn("[CALL/AUDIO] Failed to set audio sink device:", err);
      });
    }
  }, [selectedAudioOutputId]);

  return (
    <audio
      ref={audioRef}
      id="sprintforge-global-remote-audio"
      autoPlay
      playsInline
      className="hidden"
      aria-hidden="true"
    />
  );
}
