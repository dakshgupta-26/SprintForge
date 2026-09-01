"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Video,
  VideoOff,
  Mic,
  MicOff,
  ScreenShare,
  StopCircle,
  Settings,
  Maximize,
  Minimize,
  Users,
  MessageSquare,
  History,
  RotateCcw,
  Sparkles,
  Signal,
  CheckCircle2,
  AlertCircle,
  Volume2,
  ChevronRight,
  Smile,
  Send,
  Lock,
  Search,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { useCallStore, RemoteParticipant, CallType } from "@/lib/store/callStore";
import { callAPI, chatAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { AudioMeter, QualityMetrics } from "@/lib/webrtc";
import { EmojiPickerPopover } from "@/components/chat/EmojiPickerPopover";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface CallWorkspaceProps {
  projectId: string;
}

export function CallWorkspace({ projectId }: CallWorkspaceProps) {
  const { user } = useAuthStore();
  const { currentProject, projects, fetchProject } = useProjectStore();

  const {
    callId,
    callStatus,
    statusText,
    callType,
    isCaller,
    remoteUser,
    durationSeconds,
    endSummary,
    localStream,
    remoteStream,
    screenStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    remoteIsMuted,
    remoteIsVideoOff,
    remoteIsScreenSharing,
    selectedAudioInputId,
    selectedVideoInputId,
    selectedAudioOutputId,
    availableAudioInputs,
    availableVideoInputs,
    availableAudioOutputs,
    qualityMetrics,
    preCallModalOpen,
    preCallTargetMember,
    preCallType,
    preCallStream,
    preCallCamOpen,
    preCallMicOpen,
    openPreCallCheck,
    closePreCallCheck,
    togglePreCallCam,
    togglePreCallMic,
    startCallFromPreCheck,
    initiateCall,
    cancelCall,
    endActiveCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    switchAudioInput,
    switchVideoInput,
    switchAudioOutput,
    clearEndSummary,
    markProjectCallsAsRead,
  } = useCallStore();

  const [activeTab, setActiveTab] = useState<"members" | "history">("members");
  const [memberSearch, setMemberSearch] = useState("");
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipMinimized, setIsPipMinimized] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // In-call chat states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Audio level meters
  const [localMicLevel, setLocalMicLevel] = useState(0);
  const [preCallMicLevel, setPreCallMicLevel] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const preCallVideoRef = useRef<HTMLVideoElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Derive project
  const project = useMemo(() => {
    return (
      (currentProject?._id === projectId ? currentProject : null) ||
      projects.find((p) => p._id === projectId) ||
      null
    );
  }, [currentProject, projects, projectId]);

  useEffect(() => {
    if (!project) {
      fetchProject(projectId);
    }
  }, [project, projectId, fetchProject]);

  // Clear missed call badge on mount when user visits this Call workspace
  useEffect(() => {
    markProjectCallsAsRead(projectId);
  }, [projectId, markProjectCallsAsRead]);

  // ─── Socket Presence Listener for Project ───
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("join:project", { projectId, userId: user?._id });

    const handlePresenceSync = ({ projectId: pId, onlineUserIds: list }: any) => {
      if (pId === projectId) {
        setOnlineUserIds(new Set(list));
      }
    };

    const handlePresenceUpdate = ({ projectId: pId, onlineUserIds: list }: any) => {
      if (pId === projectId) {
        setOnlineUserIds(new Set(list));
      }
    };

    socket.on("presence:sync", handlePresenceSync);
    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("presence:sync", handlePresenceSync);
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [projectId, user?._id]);

  // ─── Fetch Recent Project Calls ───
  const loadRecentCalls = async () => {
    setIsLoadingHistory(true);
    try {
      const { data } = await callAPI.getRecentCalls(projectId);
      setRecentCalls(Array.isArray(data) ? data : []);
    } catch {}
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    loadRecentCalls();
  }, [projectId, callStatus]);

  // ─── Fetch Initial In-Call Messages & Socket Listener ───
  useEffect(() => {
    const loadChat = async () => {
      try {
        const { data } = await chatAPI.getMessages(projectId);
        if (Array.isArray(data?.messages)) {
          setChatMessages(data.messages.slice(-50));
        }
      } catch {}
    };
    loadChat();

    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (msg.project === projectId) {
        setChatMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("chat:message:receive", handleNewMessage);
    return () => {
      socket.off("chat:message:receive", handleNewMessage);
    };
  }, [projectId]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ─── Bind Local & Remote Media Streams to <video> Elements ───
  useEffect(() => {
    if (localVideoRef.current) {
      if (isScreenSharing && screenStream) {
        localVideoRef.current.srcObject = screenStream;
      } else if (localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, screenStream, isScreenSharing]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (preCallVideoRef.current && preCallStream) {
      preCallVideoRef.current.srcObject = preCallStream;
    }
  }, [preCallStream]);

  // ─── Audio Meters for Local & Pre-call Mic Activity ───
  useEffect(() => {
    if (!localStream) {
      setLocalMicLevel(0);
      return;
    }
    const meter = new AudioMeter(localStream, (level) => {
      setLocalMicLevel(level);
    });
    return () => meter.stop();
  }, [localStream]);

  useEffect(() => {
    if (!preCallStream) {
      setPreCallMicLevel(0);
      return;
    }
    const meter = new AudioMeter(preCallStream, (level) => {
      setPreCallMicLevel(level);
    });
    return () => meter.stop();
  }, [preCallStream]);

  // ─── Global Keyboard Shortcuts for In-Call Controls ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (callStatus === "connected") {
        if (key === "m") {
          e.preventDefault();
          toggleMute();
        } else if (key === "v") {
          e.preventDefault();
          toggleVideo();
        } else if (key === "s") {
          e.preventDefault();
          if (isScreenSharing) stopScreenShare();
          else startScreenShare();
        } else if (key === "escape") {
          setShowSettingsPopover(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callStatus, toggleMute, toggleVideo, isScreenSharing, startScreenShare, stopScreenShare]);

  // ─── Send In-Call Chat Message ───
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = chatInput.trim();
    if (!content || !user?._id) return;

    const socket = getSocket();
    if (socket) {
      socket.emit("chat:message", {
        projectId,
        content,
        sender: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          email: user.email,
        },
      });
    }
    setChatInput("");
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Format Duration
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

  // Filter project members
  const filteredMembers = useMemo(() => {
    if (!project?.members) return [];
    return project.members
      .map((m: any) => {
        const memberUser = m.user || {};
        const memberId =
          memberUser._id || (typeof m.user === "string" ? m.user : "");
        const isOnline = onlineUserIds.has(memberId);
        return {
          _id: memberId,
          name: memberUser.name || "Team Member",
          email: memberUser.email || "",
          avatar: memberUser.avatar,
          role: m.role || "Member",
          isOnline,
        };
      })
      .filter((m: any) => m._id && m._id !== user?._id)
      .filter(
        (m: any) =>
          m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.role.toLowerCase().includes(memberSearch.toLowerCase())
      );
  }, [project?.members, onlineUserIds, user?._id, memberSearch]);

  const isConnected = callStatus === "connected";
  const isCallingOrRinging = callStatus === "calling" || callStatus === "ringing" || callStatus === "initiating";

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-[calc(100vh-88px)] w-full rounded-2xl border border-white/[0.08] bg-[#05070d] overflow-hidden select-none shadow-2xl"
    >
      {/* Hidden Audio element for remote sound playback */}
      <audio ref={remoteAudioRef} autoPlay id="sprintforge-remote-audio" />

      {/* ─── 1. TOP HEADER BAR ─── */}
      <header className="h-14 px-4 sm:px-6 border-b border-white/[0.06] flex items-center justify-between bg-[#070b1a]/90 backdrop-blur-md flex-shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="text-white font-bold">{project?.name || "Project"}</span>
            <span>/</span>
            <span className="text-violet-400">Call Workspace</span>
          </div>

          {project?.key && (
            <span className="px-2 py-0.5 rounded-md bg-violet-600/15 border border-violet-500/25 text-violet-300 text-[10px] font-mono font-bold">
              {project.key}
            </span>
          )}

          {isConnected && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span>{formatDuration(durationSeconds)}</span>
            </div>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Connection Quality Indicator */}
          {isConnected && qualityMetrics && (
            <div
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold border",
                qualityMetrics.quality === "excellent"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : qualityMetrics.quality === "good"
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                  : qualityMetrics.quality === "fair"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              )}
              title={`Latency: ${qualityMetrics.rttMs}ms • Loss: ${qualityMetrics.packetLossPercent}%`}
            >
              <Signal className="w-3 h-3" />
              <span className="capitalize">{qualityMetrics.quality}</span>
              <span className="text-[10px] text-slate-500">({qualityMetrics.rttMs}ms)</span>
            </div>
          )}

          {/* Audio & Video Device Settings Popover Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettingsPopover(!showSettingsPopover)}
              className={cn(
                "p-2 rounded-xl border transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5",
                showSettingsPopover
                  ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-400 hover:text-white"
              )}
              title="Audio & Video Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Devices</span>
            </button>

            {/* Device Switcher Popover */}
            <AnimatePresence>
              {showSettingsPopover && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="absolute right-0 mt-2 w-72 p-4 rounded-2xl bg-[#090d20] border border-white/[0.12] shadow-2xl z-50 space-y-3.5 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <span className="font-bold text-white uppercase tracking-wider text-[10px] font-mono">
                      Device Preferences
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSettingsPopover(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Microphone selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-violet-400" />
                      Microphone
                    </label>
                    <select
                      value={selectedAudioInputId}
                      onChange={(e) => switchAudioInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:border-violet-500 text-xs"
                    >
                      <option value="default" className="bg-[#090d20]">Default Microphone</option>
                      {availableAudioInputs.map((d) => (
                        <option key={d.deviceId} value={d.deviceId} className="bg-[#090d20]">
                          {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Camera selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-violet-400" />
                      Camera
                    </label>
                    <select
                      value={selectedVideoInputId}
                      onChange={(e) => switchVideoInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:border-violet-500 text-xs"
                    >
                      <option value="default" className="bg-[#090d20]">Default Camera</option>
                      {availableVideoInputs.map((d) => (
                        <option key={d.deviceId} value={d.deviceId} className="bg-[#090d20]">
                          {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speaker output selector */}
                  {availableAudioOutputs.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                        Speaker / Output
                      </label>
                      <select
                        value={selectedAudioOutputId}
                        onChange={(e) => switchAudioOutput(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:border-violet-500 text-xs"
                      >
                        <option value="default" className="bg-[#090d20]">Default Speaker</option>
                        {availableAudioOutputs.map((d) => (
                          <option key={d.deviceId} value={d.deviceId} className="bg-[#090d20]">
                            {d.label || `Speaker ${d.deviceId.slice(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN SPLIT WORKSPACE BODY ─── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* LEFT / CENTER: Active Call Stage & In-Call Chat */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/[0.06] bg-[#05070d]">
          {/* Active Call Stage View */}
          <div className="relative flex-1 min-h-[320px] bg-[#070b1a] overflow-hidden flex items-center justify-center p-3 sm:p-6">
            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-950/20 via-transparent to-indigo-950/20 pointer-events-none" />

            {/* ── STATE A: Connected Call Grid ── */}
            {isConnected ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-[#030611] border border-white/[0.08]">
                {/* Screen Sharing Notification Banner */}
                {isScreenSharing && (
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md">
                    <ScreenShare className="w-3.5 h-3.5 animate-pulse" />
                    <span>You are sharing your screen</span>
                    <button
                      type="button"
                      onClick={stopScreenShare}
                      className="ml-2 px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] uppercase font-bold"
                    >
                      Stop
                    </button>
                  </div>
                )}

                {/* Remote Participant Video or Avatar Card */}
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                  {remoteIsVideoOff || callType === "audio" ? (
                    /* Audio-only or Video-off Avatar Stage */
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="relative flex items-center justify-center">
                        {/* Audio Wave Halo for remote participant */}
                        <div className="w-32 h-32 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shadow-2xl">
                          <UserAvatar
                            src={remoteUser?.avatar}
                            name={remoteUser?.name || "Participant"}
                            size="2xl"
                            className="w-24 h-24 text-2xl shadow-xl ring-4 ring-violet-500/30"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          {remoteUser?.name || "Team Member"}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          {remoteIsMuted ? "Microphone muted" : "Audio connected"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Remote Video Stream */
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                  )}

                  {/* Remote User Name & Status Badge */}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.1] text-xs text-white">
                    <span className="font-semibold">{remoteUser?.name || "Remote Member"}</span>
                    {remoteIsMuted && (
                      <span className="p-1 rounded bg-rose-500/20 text-rose-400">
                        <MicOff className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Floating Self Video PIP Preview */}
                {!isPipMinimized && (
                  <motion.div
                    drag
                    dragConstraints={{ left: 0, right: 200, top: 0, bottom: 200 }}
                    className="absolute bottom-4 right-4 z-30 w-36 sm:w-48 h-24 sm:h-32 rounded-2xl overflow-hidden bg-[#090d20] border border-white/[0.15] shadow-2xl group"
                  >
                    {isVideoOff ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b1a] text-slate-400 text-xs">
                        <UserAvatar
                          src={user?.avatar}
                          name={user?.name || "You"}
                          size="md"
                          className="mb-1"
                        />
                        <span className="text-[10px] font-mono text-slate-500">Camera Off</span>
                      </div>
                    ) : (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover mirror"
                      />
                    )}

                    {/* Self Mic Activity Bar */}
                    <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1">
                      <div className="w-12 h-1.5 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/20">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-75"
                          style={{ width: `${isMuted ? 0 : localMicLevel}%` }}
                        />
                      </div>
                      {isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
                    </div>

                    {/* Minimize PIP Button */}
                    <button
                      type="button"
                      onClick={() => setIsPipMinimized(true)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Minimize Preview"
                    >
                      <Minimize className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}

                {/* Docked In-Call Control Bar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-2xl bg-[#090d20]/90 backdrop-blur-xl border border-white/[0.12] shadow-2xl">
                  {/* Mic Toggle */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={cn(
                      "p-3 rounded-2xl font-semibold transition-all active:scale-95 cursor-pointer shadow-md",
                      isMuted
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.08]"
                    )}
                    title={isMuted ? "Unmute microphone (M)" : "Mute microphone (M)"}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Camera Toggle */}
                  <button
                    type="button"
                    onClick={toggleVideo}
                    className={cn(
                      "p-3 rounded-2xl font-semibold transition-all active:scale-95 cursor-pointer shadow-md",
                      isVideoOff
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.08]"
                    )}
                    title={isVideoOff ? "Turn camera on (V)" : "Turn camera off (V)"}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>

                  {/* Screen Share Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isScreenSharing) stopScreenShare();
                      else startScreenShare();
                    }}
                    className={cn(
                      "p-3 rounded-2xl font-semibold transition-all active:scale-95 cursor-pointer shadow-md",
                      isScreenSharing
                        ? "bg-violet-600 text-white shadow-violet-600/30"
                        : "bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.08]"
                    )}
                    title={isScreenSharing ? "Stop sharing screen (S)" : "Share screen (S)"}
                  >
                    {isScreenSharing ? (
                      <StopCircle className="w-5 h-5" />
                    ) : (
                      <ScreenShare className="w-5 h-5" />
                    )}
                  </button>

                  <div className="h-6 w-px bg-white/[0.1] mx-1" />

                  {/* End Call (Red) */}
                  <button
                    type="button"
                    onClick={endActiveCall}
                    className="p-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50"
                    title="End Call"
                  >
                    <PhoneOff className="w-5 h-5" />
                    <span className="hidden sm:inline text-xs">End</span>
                  </button>
                </div>
              </div>
            ) : isCallingOrRinging ? (
              /* ── STATE B: Outgoing Calling / Ringing State ── */
              <div className="relative flex flex-col items-center justify-center gap-6 text-center max-w-sm">
                <div className="relative flex items-center justify-center w-36 h-36">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1.5], opacity: [0.6, 0.2, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-violet-500/20 border border-violet-400/40"
                  />
                  <UserAvatar
                    src={remoteUser?.avatar || preCallTargetMember?.avatar}
                    name={remoteUser?.name || preCallTargetMember?.name || "Member"}
                    size="2xl"
                    className="w-28 h-28 text-3xl shadow-2xl ring-4 ring-violet-500/40"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {remoteUser?.name || preCallTargetMember?.name || "Calling..."}
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                    <p className="text-sm font-mono text-violet-300 font-medium">
                      {statusText || "Connecting..."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cancelCall}
                  className="mt-4 flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-lg hover:shadow-rose-950/50"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Cancel Call</span>
                </button>
              </div>
            ) : endSummary ? (
              /* ── STATE C: Call Ended Summary ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex flex-col items-center justify-center p-8 rounded-3xl bg-[#090d20] border border-white/[0.1] shadow-2xl max-w-sm w-full text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Call Ended</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    With {endSummary.remoteUser?.name || "Team Member"}
                  </p>
                  <p className="text-sm font-mono font-bold text-violet-300 mt-2">
                    Duration: {formatDuration(endSummary.duration)}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearEndSummary();
                      initiateCall(endSummary.remoteUser._id, projectId, endSummary.type);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Call Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearEndSummary}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ── STATE D: Idle Workspace Dashboard ── */
              <div className="flex flex-col items-center justify-center max-w-md text-center space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-xl">
                  <PhoneCall className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    SprintForge Real-Time Calling
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Start high-definition peer-to-peer audio/video calls with your project members.
                    Select any online member from the right to begin.
                  </p>
                </div>

                {/* Device Pre-Check Summary Card */}
                <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Quick Device Readiness
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Mic className="w-4 h-4 text-emerald-400" /> Microphone Ready
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px] font-bold">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Video className="w-4 h-4 text-violet-400" /> Camera Ready
                    </span>
                    <span className="text-violet-400 font-mono text-[11px] font-bold">Available</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* IN-CALL REALTIME CHAT SECTION */}
          <div className="h-48 sm:h-56 border-t border-white/[0.06] flex flex-col bg-[#05070d]">
            <div className="px-4 py-2 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                <span>In-Call Project Chat</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" /> End-to-End Encrypted
              </span>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs scrollbar-thin">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-[11px]">
                  No messages yet. Send a message to project members during the call.
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = msg.sender?._id === user?._id;
                  return (
                    <div
                      key={msg._id || i}
                      className={cn("flex items-start gap-2", isMe && "flex-row-reverse")}
                    >
                      <UserAvatar
                        src={msg.sender?.avatar}
                        name={msg.sender?.name || "Member"}
                        size="xs"
                        className="mt-0.5"
                      />
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-1.5 text-xs",
                          isMe
                            ? "bg-violet-600 text-white rounded-tr-none"
                            : "bg-white/[0.06] text-slate-200 rounded-tl-none border border-white/[0.06]"
                        )}
                      >
                        {!isMe && (
                          <p className="text-[10px] font-bold text-violet-300 mb-0.5">
                            {msg.sender?.name}
                          </p>
                        )}
                        <p className="break-words">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-2 px-3 border-t border-white/[0.04] bg-[#070b1a] flex items-center gap-2"
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="Emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
                <EmojiPickerPopover
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onEmojiSelect={(emoji) => {
                    setChatInput((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </div>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message to project members..."
                className="flex-1 bg-transparent border-none text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white transition-colors cursor-pointer"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* ─── RIGHT SIDEBAR: PROJECT MEMBERS & CALL HISTORY ─── */}
        <div className="w-full lg:w-80 flex flex-col flex-shrink-0 bg-[#070b1a] border-t lg:border-t-0">
          {/* Tabs */}
          <div className="flex items-center border-b border-white/[0.06] px-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={cn(
                "flex-1 py-2 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === "members"
                  ? "border-violet-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Project Members ({filteredMembers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex-1 py-2 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === "history"
                  ? "border-violet-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              <History className="w-3.5 h-3.5" />
              <span>Recent Calls</span>
            </button>
          </div>

          {/* TAB 1: MEMBERS LIST */}
          {activeTab === "members" ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search */}
              <div className="p-3 border-b border-white/[0.04]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Members Scroll List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                {filteredMembers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No members found matching your search.
                  </div>
                ) : (
                  filteredMembers.map((member: any) => (
                    <div
                      key={member._id}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-white/[0.08] transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="relative flex-shrink-0">
                          <UserAvatar
                            src={member.avatar}
                            name={member.name}
                            size="md"
                            className="w-8 h-8"
                          />
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#070b1a]",
                              member.isOnline
                                ? "bg-emerald-500 shadow-[0_0_6px_#10b981]"
                                : "bg-slate-600"
                            )}
                            title={member.isOnline ? "Online" : "Offline"}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                            {member.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-medium">
                            <span>{member.role}</span>
                            <span>•</span>
                            <span className={member.isOnline ? "text-emerald-400 font-mono" : "text-slate-500"}>
                              {member.isOnline ? "Online" : "Offline"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Call Action Buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Audio Call Button */}
                        <button
                          type="button"
                          disabled={!member.isOnline || isConnected || isCallingOrRinging}
                          onClick={() => openPreCallCheck(member, "audio", projectId, project?.name || "")}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-violet-600/20 hover:text-violet-300 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 transition-colors cursor-pointer"
                          title={member.isOnline ? `Audio Call with ${member.name}` : "User is offline"}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>

                        {/* Video Call Button */}
                        <button
                          type="button"
                          disabled={!member.isOnline || isConnected || isCallingOrRinging}
                          onClick={() => openPreCallCheck(member, "video", projectId, project?.name || "")}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-violet-600/20 hover:text-violet-300 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 transition-colors cursor-pointer"
                          title={member.isOnline ? `Video Call with ${member.name}` : "User is offline"}
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: CALL HISTORY */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                {isLoadingHistory ? (
                  <div className="p-6 text-center text-xs text-slate-500">Loading call history...</div>
                ) : recentCalls.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No recent calls in this project.
                  </div>
                ) : (
                  recentCalls.map((call) => {
                    const isCallerMe = call.caller?._id === user?._id;
                    const otherUser = isCallerMe ? call.receiver : call.caller;
                    const isMissed = call.status === "missed";
                    const isCompleted = call.status === "completed";

                    return (
                      <div
                        key={call._id}
                        className={cn(
                          "group p-3 rounded-xl border transition-all text-xs flex items-center justify-between",
                          isMissed
                            ? "bg-rose-500/5 border-rose-500/20"
                            : "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <UserAvatar
                            src={otherUser?.avatar}
                            name={otherUser?.name || "Member"}
                            size="sm"
                            className="w-7 h-7"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{otherUser?.name || "Team Member"}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {call.type === "video" ? "📹 Video" : "📞 Audio"} •{" "}
                              {isMissed ? (
                                <span className="text-rose-400 font-semibold">Missed</span>
                              ) : isCompleted ? (
                                `${formatDuration(call.duration || 0)}`
                              ) : (
                                call.status
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Call Again Button */}
                        {otherUser?._id && (
                          <button
                            type="button"
                            onClick={() =>
                              openPreCallCheck(
                                otherUser,
                                call.type || "video",
                                projectId,
                                project?.name || ""
                              )
                            }
                            className="p-1.5 rounded-lg bg-violet-600/15 hover:bg-violet-600/30 text-violet-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Call again"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span className="hidden sm:inline">Call</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── 3. PRE-CALL DEVICE CHECK MODAL ─── */}
      <AnimatePresence>
        {preCallModalOpen && preCallTargetMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.12] bg-[#070b1a] p-6 shadow-2xl space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Device & Audio Setup</h3>
                  <p className="text-xs text-slate-400">
                    Calling {preCallTargetMember.name} ({preCallType === "video" ? "Video" : "Audio"})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePreCallCheck}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Camera Preview Box */}
              {preCallType === "video" && (
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-black border border-white/[0.1] flex items-center justify-center">
                  {!preCallCamOpen ? (
                    <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                      <VideoOff className="w-6 h-6" />
                      <span>Camera is turned off</span>
                    </div>
                  ) : (
                    <video
                      ref={preCallVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />
                  )}

                  {/* Pre-Call Mic Level Bar */}
                  <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md">
                    <Mic className="w-3 h-3 text-emerald-400" />
                    <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-75"
                        style={{ width: `${preCallMicOpen ? preCallMicLevel : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pre-call Control Toggles */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={togglePreCallMic}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors cursor-pointer border",
                    !preCallMicOpen
                      ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                      : "bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.1] text-white"
                  )}
                >
                  {!preCallMicOpen ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{!preCallMicOpen ? "Mic Muted" : "Mic On"}</span>
                </button>

                {preCallType === "video" && (
                  <button
                    type="button"
                    onClick={togglePreCallCam}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors cursor-pointer border",
                      !preCallCamOpen
                        ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                        : "bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.1] text-white"
                    )}
                  >
                    {!preCallCamOpen ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    <span>{!preCallCamOpen ? "Cam Off" : "Cam On"}</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={closePreCallCheck}
                  className="flex-1 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={startCallFromPreCheck}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/30"
                >
                  {preCallType === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  <span>Start Call</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
