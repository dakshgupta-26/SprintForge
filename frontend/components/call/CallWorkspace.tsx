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
  ShieldCheck,
  Radio,
  X,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
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

function LiveKitVideoTrackView({
  track,
  className,
}: {
  track: any;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className={className || "w-full h-full object-contain bg-black"}
    />
  );
}

function LiveKitAudioTrackView({ track }: { track: any }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" aria-hidden="true" />;
}

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
    remoteParticipants,
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
    errorMessage,
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
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Audio level meters
  const [localMicLevel, setLocalMicLevel] = useState(0);
  const [preCallMicLevel, setPreCallMicLevel] = useState(0);

  const isConnected = callStatus === "connected";
  const isCallingOrRinging =
    callStatus === "calling" || callStatus === "ringing" || callStatus === "initiating";

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
    if (isChatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

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
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream, isConnected]);

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
        } else if (key === "c") {
          e.preventDefault();
          setIsChatOpen((prev) => !prev);
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

  const formatCallDate = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr);
      if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
      if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
      return format(d, "MMM d, h:mm a");
    } catch {
      return "";
    }
  };

  const formatDurationText = (sec: number) => {
    if (!sec || sec <= 0) return "0s";
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    if (mins > 0) {
      return `${mins}m ${remainingSecs}s`;
    }
    return `${remainingSecs}s`;
  };

  // Filter and sort project members (online users prioritized first)
  const filteredMembers = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    // 1. Add owner if populated
    if (project?.owner) {
      const ownerObj = typeof project.owner === "object" ? (project.owner as any) : null;
      const ownerId = String(ownerObj?._id || project.owner);
      if (ownerId && !seenIds.has(ownerId)) {
        seenIds.add(ownerId);
        list.push({
          _id: ownerId,
          name: ownerObj?.name || "Project Owner",
          email: ownerObj?.email || "",
          avatar: ownerObj?.avatar,
          role: "Owner",
          isOnline: onlineUserIds.has(ownerId),
        });
      }
    }

    // 2. Add members
    if (Array.isArray(project?.members)) {
      project.members.forEach((m: any) => {
        const memberUser = m.user || {};
        const memberId = String(memberUser._id || (typeof m.user === "string" ? m.user : ""));
        if (memberId && !seenIds.has(memberId)) {
          seenIds.add(memberId);
          list.push({
            _id: memberId,
            name: memberUser.name || "Team Member",
            email: memberUser.email || "",
            avatar: memberUser.avatar,
            role: m.role || "Member",
            isOnline: onlineUserIds.has(memberId),
          });
        }
      });
    }

    return list
      .filter((m: any) => m._id && m._id !== user?._id)
      .filter(
        (m: any) =>
          m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.role.toLowerCase().includes(memberSearch.toLowerCase())
      )
      .sort((a: any, b: any) => {
        if (a.isOnline === b.isOnline) return a.name.localeCompare(b.name);
        return a.isOnline ? -1 : 1;
      });
  }, [project?.owner, project?.members, onlineUserIds, user?._id, memberSearch]);

  const onlineCount = useMemo(() => {
    return filteredMembers.filter((m) => m.isOnline).length;
  }, [filteredMembers]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-[calc(100vh-88px)] w-full rounded-2xl border border-white/[0.08] bg-[#05070d] overflow-hidden select-none shadow-2xl"
    >
      {/* Hidden Audio element for remote sound playback fallback */}
      <audio ref={remoteAudioRef} autoPlay id="sprintforge-remote-audio-workspace" />

      {/* ─── 1. TOP HEADER BAR ─── */}
      <header className="h-14 px-4 sm:px-6 border-b border-white/[0.06] flex items-center justify-between bg-[#080c1d]/90 backdrop-blur-md flex-shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="text-white font-bold truncate max-w-[140px] sm:max-w-[200px]">
              {project?.name || "Project"}
            </span>
            <span>/</span>
            <span className="text-violet-400 font-medium">SprintForge Call</span>
          </div>

          {project?.key && (
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-violet-600/15 border border-violet-500/25 text-violet-300 text-[10px] font-mono font-bold">
              {project.key}
            </span>
          )}

          {isConnected ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span>{formatDuration(durationSeconds)}</span>
            </div>
          ) : isCallingOrRinging ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              <span>{statusText || "Calling..."}</span>
            </div>
          ) : null}
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2">
          {/* Connection Quality Pill */}
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

          {/* Device Settings Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettingsPopover(!showSettingsPopover)}
              className={cn(
                "p-2 px-3 rounded-xl border transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5",
                showSettingsPopover
                  ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-400 hover:text-white"
              )}
              title="Audio & Video Device Preferences"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Devices</span>
            </button>

            {/* Device Switcher Dropdown */}
            <AnimatePresence>
              {showSettingsPopover && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="absolute right-0 mt-2 w-72 p-4 rounded-2xl bg-[#090d20] border border-white/[0.12] shadow-2xl z-50 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <span className="font-bold text-white uppercase tracking-wider text-[10px] font-mono">
                      Device Preferences
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSettingsPopover(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
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
                      <option value="default" className="bg-[#090d20]">
                        Default Microphone
                      </option>
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
                      <option value="default" className="bg-[#090d20]">
                        Default Camera
                      </option>
                      {availableVideoInputs.map((d) => (
                        <option key={d.deviceId} value={d.deviceId} className="bg-[#090d20]">
                          {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speaker selector */}
                  {availableAudioOutputs.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                        Speaker
                      </label>
                      <select
                        value={selectedAudioOutputId}
                        onChange={(e) => switchAudioOutput(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:border-violet-500 text-xs"
                      >
                        <option value="default" className="bg-[#090d20]">
                          Default Speaker
                        </option>
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

          {/* In-Call Chat Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "p-2 rounded-xl border transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5",
              isChatOpen
                ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-400 hover:text-white"
            )}
            title="Toggle In-Call Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Chat</span>
            {chatMessages.length > 0 && !isChatOpen && (
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN SPLIT WORKSPACE BODY ─── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* LEFT / CENTER: Main Call Stage */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/[0.06] bg-[#05070d] relative overflow-hidden">
          {/* Main Stage Canvas */}
          <div className="relative flex-1 min-h-[300px] bg-[#070b1a] overflow-hidden flex items-center justify-center p-3 sm:p-5">
            {/* Subtle Ambient Vignette */}
            <div className="absolute inset-0 bg-radial from-violet-950/20 via-transparent to-[#05070d]/80 pointer-events-none" />

            {/* ── STAGE STATE A: Connected Call ── */}
            {isConnected ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-[#030611] border border-white/[0.08] shadow-inner">
                {/* Screen Sharing Notification */}
                {isScreenSharing && (
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md">
                    <ScreenShare className="w-3.5 h-3.5 animate-pulse" />
                    <span>Sharing your screen</span>
                    <button
                      type="button"
                      onClick={stopScreenShare}
                      className="ml-2 px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] uppercase font-bold"
                    >
                      Stop
                    </button>
                  </div>
                )}

                {/* ─── MULTI-PARTICIPANT / SFU CANVAS ─── */}
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-2 sm:p-4">
                  {/* Case 1: Remote Screen Share Active */}
                  {remoteParticipants.some((p) => p.screenTrack) ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      {(() => {
                        const screenSharer = remoteParticipants.find((p) => p.screenTrack)!;
                        return (
                          <div className="relative w-full h-full flex items-center justify-center bg-black rounded-2xl overflow-hidden border border-white/[0.1]">
                            <LiveKitVideoTrackView
                              track={screenSharer.screenTrack}
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/[0.1] text-xs text-white">
                              <ScreenShare className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                              <span>{screenSharer.name} is sharing screen</span>
                            </div>
                            <LiveKitAudioTrackView track={screenSharer.audioTrack} />
                          </div>
                        );
                      })()}
                    </div>
                  ) : remoteParticipants.length === 0 ? (
                    /* Case 2: Waiting for other participants */
                    <div className="flex flex-col items-center justify-center gap-4 text-center select-none max-w-sm">
                      <div className="relative flex items-center justify-center w-32 h-32">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1.35], opacity: [0.5, 0.2, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                          className="absolute inset-0 rounded-full bg-violet-500/20 border border-violet-500/30"
                        />
                        <UserAvatar
                          src={user?.avatar}
                          name={user?.name || "You"}
                          size="2xl"
                          className="w-20 h-20 text-xl shadow-2xl ring-4 ring-violet-500/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          Connected to Call Room
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span>Waiting for team members to join...</span>
                        </p>
                      </div>
                    </div>
                  ) : remoteParticipants.length === 1 ? (
                    /* Case 3: Exactly 1 Remote Participant (1-on-1 Call) */
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      {remoteParticipants[0].videoTrack && !remoteParticipants[0].isVideoOff ? (
                        <LiveKitVideoTrackView
                          track={remoteParticipants[0].videoTrack}
                          className="w-full h-full object-contain bg-black rounded-2xl"
                        />
                      ) : (
                        /* Audio-Only / Video-Off Stage */
                        <div className="flex flex-col items-center justify-center gap-4 text-center select-none">
                          <div className="relative flex items-center justify-center w-36 h-36">
                            <motion.div
                              animate={{
                                scale: remoteParticipants[0].isSpeaking ? [1, 1.2, 1.35] : [1, 1.05, 1],
                                opacity: remoteParticipants[0].isSpeaking ? [0.6, 0.25, 0] : [0.3, 0.1, 0],
                              }}
                              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                              className="absolute inset-0 rounded-full bg-violet-500/20 border border-violet-500/30"
                            />
                            <UserAvatar
                              src={remoteParticipants[0].avatar}
                              name={remoteParticipants[0].name}
                              size="2xl"
                              className="w-24 h-24 text-2xl shadow-2xl ring-4 ring-violet-500/30"
                            />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white tracking-tight">
                              {remoteParticipants[0].name}
                            </h3>
                            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>LiveKit SFU Realtime Media</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Participant audio sink */}
                      <LiveKitAudioTrackView track={remoteParticipants[0].audioTrack} />

                      {/* Name Tag */}
                      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/[0.1] text-xs text-white">
                        <span className="font-semibold">{remoteParticipants[0].name}</span>
                        {remoteParticipants[0].isMuted && (
                          <span className="p-0.5 rounded bg-rose-500/20 text-rose-400" title="Microphone muted">
                            <MicOff className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Case 4: Multi-Participant Grid (2+ Remote Participants) */
                    <div
                      className={cn(
                        "w-full h-full grid gap-3 overflow-y-auto p-1",
                        remoteParticipants.length === 2
                          ? "grid-cols-1 md:grid-cols-2"
                          : remoteParticipants.length <= 4
                          ? "grid-cols-2"
                          : "grid-cols-2 md:grid-cols-3"
                      )}
                    >
                      {remoteParticipants.map((p) => (
                        <div
                          key={p.identity}
                          className={cn(
                            "relative w-full h-full min-h-[160px] rounded-2xl overflow-hidden bg-[#030611] border border-white/[0.08] flex items-center justify-center transition-all",
                            p.isSpeaking && "ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                          )}
                        >
                          {p.videoTrack && !p.isVideoOff ? (
                            <LiveKitVideoTrackView track={p.videoTrack} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2">
                              <UserAvatar src={p.avatar} name={p.name} size="lg" className="w-14 h-14 text-base ring-2 ring-violet-500/30" />
                              <span className="text-xs font-bold text-white max-w-[120px] truncate">{p.name}</span>
                            </div>
                          )}

                          <LiveKitAudioTrackView track={p.audioTrack} />

                          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] text-white">
                            <span className="font-semibold truncate max-w-[90px]">{p.name}</span>
                            {p.isMuted && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Floating Self Video (Picture-in-Picture) */}
                  {!isPipMinimized && (
                    <motion.div
                      drag
                      dragConstraints={{ left: 0, right: 150, top: 0, bottom: 150 }}
                      className="absolute bottom-4 right-4 z-30 w-36 sm:w-44 h-24 sm:h-28 rounded-2xl overflow-hidden bg-[#090d20] border border-white/[0.15] shadow-2xl group cursor-move"
                    >
                      {isVideoOff ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b1a] text-slate-400 text-xs">
                          <UserAvatar
                            src={user?.avatar}
                            name={user?.name || "You"}
                            size="sm"
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

                      {/* Self Mic Activity Gauge */}
                      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1">
                        <div className="w-10 h-1 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/20">
                          <div
                            className="h-full bg-emerald-400 rounded-full transition-all duration-75"
                            style={{ width: `${isMuted ? 0 : localMicLevel}%` }}
                          />
                        </div>
                        {isMuted && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
                      </div>

                      {/* Minimize PIP */}
                      <button
                        type="button"
                        onClick={() => setIsPipMinimized(true)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Minimize Preview"
                      >
                        <Minimize className="w-2.5 h-2.5" />
                      </button>
                    </motion.div>
                  )}
                </div>


                {/* Docked Control Bar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 px-4 py-2 rounded-2xl bg-[#090d20]/90 backdrop-blur-xl border border-white/[0.12] shadow-2xl">
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
                    {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
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
                    {isVideoOff ? (
                      <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
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
                    title={isScreenSharing ? "Stop sharing (S)" : "Share screen (S)"}
                  >
                    {isScreenSharing ? (
                      <StopCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <ScreenShare className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>

                  <div className="h-6 w-px bg-white/[0.1] mx-0.5" />

                  {/* End Call Button */}
                  <button
                    type="button"
                    onClick={endActiveCall}
                    className="p-3 px-4 sm:px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50"
                    title="End Call"
                  >
                    <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline text-xs">End Call</span>
                  </button>
                </div>
              </div>
            ) : isCallingOrRinging ? (
              /* ── STAGE STATE B: Outgoing Calling / Ringing ── */
              <div className="relative flex flex-col items-center justify-center gap-6 text-center max-w-sm">
                <div className="relative flex items-center justify-center w-36 h-36">
                  {/* Concentric Soft Pulse Rings */}
                  <motion.div
                    animate={{ scale: [1, 1.3, 1.55], opacity: [0.6, 0.25, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-violet-500/20 border border-violet-400/40"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1.4], opacity: [0.7, 0.35, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                    className="absolute inset-2 rounded-full bg-violet-500/30 border border-violet-400/50"
                  />

                  <UserAvatar
                    src={remoteUser?.avatar || preCallTargetMember?.avatar}
                    name={remoteUser?.name || preCallTargetMember?.name || "Member"}
                    size="2xl"
                    className="w-24 h-24 text-2xl shadow-2xl ring-4 ring-violet-500/40"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {remoteUser?.name || preCallTargetMember?.name || "Calling..."}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-violet-300 font-medium text-sm">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                    <p className="font-mono">{statusText || "Calling recipient..."}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cancelCall}
                  className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-lg hover:shadow-rose-950/50"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>Cancel Call</span>
                </button>
              </div>
            ) : callStatus === "failed" ? (
              /* ── STAGE STATE: Call Failed / Disconnected ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex flex-col items-center justify-center p-8 rounded-3xl bg-[#080c1d] border border-rose-500/30 shadow-2xl max-w-md w-full text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-white">Call Failed</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                    {errorMessage || statusText || "Unable to establish call connection."}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (preCallTargetMember?._id) {
                        initiateCall(preCallTargetMember._id, projectId, preCallType);
                      } else if (remoteUser?._id) {
                        initiateCall(remoteUser._id, projectId, callType);
                      } else {
                        useCallStore.setState({ callStatus: "idle", errorMessage: null });
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => useCallStore.setState({ callStatus: "idle", errorMessage: null })}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            ) : endSummary ? (
              /* ── STAGE STATE C: Call Ended Summary ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex flex-col items-center justify-center p-8 rounded-3xl bg-[#080c1d] border border-white/[0.1] shadow-2xl max-w-sm w-full text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Call Ended</h3>
                  <p className="text-xs text-slate-400">
                    With {endSummary.remoteUser?.name || "Team Member"}
                  </p>
                  <p className="text-sm font-mono font-bold text-violet-300 mt-2">
                    Duration: {formatDurationText(endSummary.duration)}
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
              /* ── STAGE STATE D: Idle Workspace ── */
              <div className="flex flex-col items-center justify-center max-w-md text-center space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-xl">
                  <PhoneCall className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    SprintForge Call
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium">
                    Connect with your project team
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    High-definition, end-to-end encrypted audio and video calling. Choose an online
                    member from the panel to get started.
                  </p>
                </div>

                {/* Device Readiness Preview */}
                <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Mic className="w-4 h-4 text-emerald-400" /> Microphone
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px] font-bold">Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Video className="w-4 h-4 text-violet-400" /> Camera
                    </span>
                    <span className="text-violet-400 font-mono text-[11px] font-bold">Available</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Slide-over In-Call Chat */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "220px", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-white/[0.06] flex flex-col bg-[#080c1d] overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                    <span>In-Call Project Chat</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs scrollbar-thin">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-[11px]">
                      No messages yet. Send a message to project members.
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

                {/* Chat Input */}
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
                    placeholder="Type a message..."
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── RIGHT SIDEBAR: PROJECT MEMBERS & CALL HISTORY ─── */}
        <div className="w-full lg:w-80 flex flex-col flex-shrink-0 bg-[#080c1d] border-t lg:border-t-0">
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
              <span>
                Team Members ({onlineCount}/{filteredMembers.length})
              </span>
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
                    placeholder="Search project members..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Members Scroll List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                {filteredMembers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No members found in this project.
                  </div>
                ) : (
                  filteredMembers.map((member: any) => (
                    <div
                      key={member._id}
                      className="group flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-white/[0.08] transition-all"
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
                              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#080c1d]",
                              member.isOnline
                                ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
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

                      {/* Direct 1-Click Call Buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Audio Call */}
                        <button
                          type="button"
                          disabled={!member.isOnline || isConnected || isCallingOrRinging}
                          onClick={() =>
                            openPreCallCheck(member, "audio", projectId, project?.name || "")
                          }
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 hover:text-emerald-300 disabled:opacity-25 disabled:hover:bg-transparent text-slate-400 transition-all cursor-pointer"
                          title={member.isOnline ? `Start Audio Call with ${member.name}` : "User is offline"}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>

                        {/* Video Call */}
                        <button
                          type="button"
                          disabled={!member.isOnline || isConnected || isCallingOrRinging}
                          onClick={() =>
                            openPreCallCheck(member, "video", projectId, project?.name || "")
                          }
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-violet-600/20 hover:text-violet-300 disabled:opacity-25 disabled:hover:bg-transparent text-slate-400 transition-all cursor-pointer"
                          title={member.isOnline ? `Start Video Call with ${member.name}` : "User is offline"}
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
                          "group p-3 rounded-2xl border transition-all text-xs flex items-center justify-between",
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
                            <p className="font-bold text-white truncate">
                              {otherUser?.name || "Team Member"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                              {isCallerMe ? (
                                <PhoneOutgoing className="w-3 h-3 text-slate-400" />
                              ) : isMissed ? (
                                <PhoneMissed className="w-3 h-3 text-rose-400" />
                              ) : (
                                <PhoneIncoming className="w-3 h-3 text-emerald-400" />
                              )}
                              <span>{call.type === "video" ? "Video" : "Audio"}</span>
                              <span>•</span>
                              {isMissed ? (
                                <span className="text-rose-400 font-semibold">Missed</span>
                              ) : (
                                <span>{formatDurationText(call.duration || 0)}</span>
                              )}
                            </p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                              {formatCallDate(call.createdAt)}
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
                            className="p-1.5 px-2.5 rounded-xl bg-violet-600/15 hover:bg-violet-600/30 text-violet-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Call again"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Call</span>
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
    </div>
  );
}
