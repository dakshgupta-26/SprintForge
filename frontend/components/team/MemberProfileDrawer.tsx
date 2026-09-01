"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  Mail,
  Copy,
  Check,
  Video,
  MessageSquare,
  Settings,
  MapPin,
  Globe,
  Clock,
  ShieldCheck,
  Crown,
  Shield,
  Eye,
  FolderKanban,
  Layers,
  CheckCircle2,
  Zap,
  ExternalLink,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { teamsAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useCallStore } from "@/lib/store/callStore";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { formatDate, cn, PRIORITY_COLORS, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import toast from "react-hot-toast";

export interface MemberProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  initialMemberData?: any;
  projectId?: string;
  projectName?: string;
  onlineUserIds?: string[];
}

interface ProfileUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  title?: string;
  bio?: string;
  location?: string;
  website?: string;
  timezone?: string;
  language?: string;
  emailVerified: boolean;
  createdAt: string;
  lastSeen?: string;
}

interface ProfileStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  activeTasks: number;
  projectsCount: number;
}

interface ProfileTask {
  _id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  project: {
    _id: string;
    name: string;
    key: string;
    color?: string;
  };
}

interface ProfileProject {
  _id: string;
  name: string;
  key: string;
  color?: string;
  type: string;
  role: string;
  isOwner?: boolean;
}

interface ProfileData {
  user: ProfileUser;
  stats: ProfileStats;
  assignedTasks: ProfileTask[];
  projects: ProfileProject[];
}

const ROLE_BADGES = {
  owner: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  admin: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  member: "text-violet-400 bg-violet-500/10 border-violet-500/25",
  viewer: "text-slate-400 bg-slate-500/10 border-slate-500/25",
};

// In-memory cache for fast snappy drawer opening during session
const profileCache = new Map<string, ProfileData>();

export function MemberProfileDrawer({
  isOpen,
  onClose,
  userId,
  initialMemberData,
  projectId,
  projectName,
  onlineUserIds = [],
}: MemberProfileDrawerProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { user: currentUser } = useAuthStore();
  const { openPreCallCheck } = useCallStore();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // Request sequence tracker to avoid race conditions when switching members rapidly
  const currentReqToken = useRef<number>(0);

  // Safely resolve the target user's string ID
  const targetUserId = useMemo(() => {
    if (typeof userId === "string" && userId.trim() && userId !== "[object Object]") {
      return userId.trim();
    }
    if (initialMemberData) {
      const u = initialMemberData.user;
      if (typeof u === "string" && u.trim() && u !== "[object Object]") return u.trim();
      if (u?._id && typeof u._id === "string") return u._id.trim();
      if (initialMemberData._id && typeof initialMemberData._id === "string") return initialMemberData._id.trim();
    }
    return null;
  }, [userId, initialMemberData]);

  // Fetch full profile from backend
  const fetchProfile = useCallback(async (bypassCache = false) => {
    if (!targetUserId) {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage("Member identifier is missing.");
      return;
    }

    // Check cache first for instant feedback
    const cacheKey = `${targetUserId}_${projectId || "global"}`;
    if (!bypassCache && profileCache.has(cacheKey)) {
      setProfileData(profileCache.get(cacheKey)!);
      setIsLoading(false);
      setHasError(false);
      setErrorMessage(null);
      return;
    }

    const token = ++currentReqToken.current;
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      const res = await teamsAPI.getMemberProfile(targetUserId, projectId);
      // Ensure we only apply results if this request is the latest active one
      if (token === currentReqToken.current) {
        setProfileData(res.data);
        profileCache.set(cacheKey, res.data);
      }
    } catch (err: any) {
      if (token === currentReqToken.current) {
        console.error("Failed to load member profile:", err);
        setHasError(true);
        const serverMsg =
          err?.response?.data?.message ||
          (err?.response?.status === 404
            ? "Member profile not found."
            : err?.response?.status === 403
            ? "You do not share any active workspaces with this member."
            : err?.response?.status === 401
            ? "Your session has expired. Please sign in again."
            : "We couldn't load this member's workspace profile right now. Please try again.");
        setErrorMessage(serverMsg);
      }
    } finally {
      if (token === currentReqToken.current) {
        setIsLoading(false);
      }
    }
  }, [targetUserId, projectId]);

  useEffect(() => {
    if (isOpen && targetUserId) {
      fetchProfile();
    } else if (!isOpen) {
      setProfileData(null);
      setIsBioExpanded(false);
      setEmailCopied(false);
      setHasError(false);
      setErrorMessage(null);
    }
  }, [isOpen, targetUserId, fetchProfile]);

  // Keyboard Navigation: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Derive target user from fetched data or optimistic initial prop
  const user = profileData?.user || initialMemberData?.user || initialMemberData;
  const isSelf = currentUser?._id && user?._id && currentUser._id === user._id;
  const isOnline = user?._id ? onlineUserIds.includes(user._id) : false;

  const handleCopyEmail = () => {
    if (!user?.email) return;
    navigator.clipboard.writeText(user.email);
    setEmailCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const handleStartCall = (type: "audio" | "video" = "video") => {
    if (!user?._id || !projectId) {
      toast.error("Call workspace context is unavailable");
      return;
    }

    openPreCallCheck(
      {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        role: user.role,
      },
      type,
      projectId,
      projectName || "SprintForge Workspace"
    );
    onClose();
  };

  const handleSendMessage = () => {
    if (projectId) {
      router.push(`/dashboard/projects/${projectId}/chat`);
      onClose();
    } else if (profileData?.projects?.[0]?._id) {
      router.push(`/dashboard/projects/${profileData.projects[0]._id}/chat`);
      onClose();
    } else {
      toast.error("Please join a shared project channel to chat");
    }
  };

  const handleEditProfile = () => {
    router.push("/dashboard/profile");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* ─── Backdrop Blur ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* ─── Profile Drawer Panel ─── */}
        <motion.aside
          initial={{ x: "100%", opacity: shouldReduceMotion ? 1 : 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: shouldReduceMotion ? 1 : 0.8 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 34,
          }}
          className="relative z-10 w-full max-w-full sm:max-w-lg md:max-w-xl h-full bg-[#070a14] border-l border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-foreground"
          role="dialog"
          aria-modal="true"
          aria-label={`${user?.name || "Member"}'s Profile`}
        >
          {/* ─── Top Navigation Bar ─── */}
          <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold tracking-widest text-violet-400 uppercase">
                MEMBER PROFILE
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block font-mono text-[10px] text-slate-500 uppercase">
                ESC
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
                aria-label="Close profile drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Scrollable Profile Body ─── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {isLoading && !profileData ? (
              /* ─── Skeleton Loading State ─── */
              <div className="space-y-6 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/[0.06]" />
                  <div className="flex-1 space-y-2.5 pt-1">
                    <div className="w-40 h-5 rounded-lg bg-white/[0.08]" />
                    <div className="w-28 h-3.5 rounded-lg bg-white/[0.04]" />
                    <div className="w-32 h-3 rounded-lg bg-white/[0.04]" />
                  </div>
                </div>

                {/* Actions Skeleton */}
                <div className="h-11 rounded-2xl bg-white/[0.04]" />

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl bg-white/[0.04] p-3" />
                  ))}
                </div>

                {/* About Skeleton */}
                <div className="space-y-3">
                  <div className="w-20 h-3 rounded bg-white/[0.06]" />
                  <div className="h-16 rounded-2xl bg-white/[0.03]" />
                </div>

                {/* Tasks Skeleton */}
                <div className="space-y-3">
                  <div className="w-28 h-3 rounded bg-white/[0.06]" />
                  <div className="h-24 rounded-2xl bg-white/[0.03]" />
                </div>
              </div>
            ) : hasError ? (
              /* ─── Error State ─── */
              <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5 font-display">
                  Unable to load profile
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
                  {errorMessage ||
                    "We couldn't load this member's workspace profile right now. Please try again."}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition-all"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchProfile(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-[0_0_16px_rgba(124,92,255,0.35)] transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              /* ─── Main Loaded Profile Content ─── */
              <>
                {/* ── 1. Header & Identity ── */}
                <div className="relative p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] overflow-hidden">
                  {/* Atmospheric Glow */}
                  <div
                    className="absolute -top-10 -left-10 w-44 h-44 rounded-full opacity-25 blur-3xl pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, transparent 70%)",
                    }}
                  />

                  <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Large Avatar */}
                    <div className="relative flex-shrink-0">
                      <UserAvatar
                        src={user?.avatar}
                        name={user?.name || "Member"}
                        size="2xl"
                        shape="rounded-2xl"
                        showOnline={true}
                        isOnline={isOnline}
                        ringClassName="ring-2 ring-violet-500/30 border border-white/10 shadow-[0_0_24px_rgba(124,92,255,0.25)]"
                      />
                    </div>

                    {/* Member Meta */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight font-display truncate">
                          {user?.name || "Workspace Member"}
                        </h2>

                        {isSelf && (
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            You
                          </span>
                        )}

                        {user?.emailVerified && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"
                            title="Verified account"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>

                      {/* Job Title / Role */}
                      <p className="text-xs sm:text-sm font-medium text-violet-300/90">
                        {user?.title || "Engineering Team Member"}
                      </p>

                      {/* Email + Copy button */}
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{user?.email}</span>
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                          title="Copy email address"
                        >
                          {emailCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Badges strip: Workspace Role & Presence */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {/* Role badge */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border capitalize",
                            ROLE_BADGES[(user?.role || "member").toLowerCase() as keyof typeof ROLE_BADGES] ||
                              "text-slate-400 bg-slate-500/10 border-slate-500/20"
                          )}
                        >
                          {user?.role === "admin" ? (
                            <Crown className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Shield className="w-3 h-3 text-violet-400" />
                          )}
                          {user?.role || "Member"}
                        </span>

                        {/* Online Status badge */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full border",
                            isOnline
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-semibold"
                              : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                            )}
                          />
                          {isOnline ? "Online" : "Offline"}
                        </span>

                        {/* Joined Date */}
                        {user?.createdAt && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500">
                            <Calendar className="w-3 h-3" />
                            Joined {formatDate(user.createdAt, "short")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 2. Primary Actions ── */}
                <div className="flex items-center gap-2.5">
                  {isSelf ? (
                    <button
                      type="button"
                      onClick={handleEditProfile}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(124,92,255,0.35)] transition-all active:scale-[0.98]"
                    >
                      <Settings className="w-4 h-4" />
                      Edit Profile Settings
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(124,92,255,0.35)] transition-all active:scale-[0.98]"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartCall("video")}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white font-semibold text-xs sm:text-sm transition-all active:scale-[0.98]"
                        title="Start video call"
                      >
                        <Video className="w-4 h-4 text-violet-400" />
                        <span className="hidden sm:inline">Start Call</span>
                      </button>
                    </>
                  )}
                </div>

                {/* ── 3. Productivity Stats Grid ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-[#090d1f] border border-white/[0.06] text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-mono uppercase font-bold">
                      <Layers className="w-3 h-3 text-slate-500" /> Tasks
                    </div>
                    <p className="text-lg font-extrabold text-white font-display">
                      {profileData?.stats?.totalTasks ?? 0}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#090d1f] border border-white/[0.06] text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 text-emerald-400/90 text-[10px] font-mono uppercase font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Done
                    </div>
                    <p className="text-lg font-extrabold text-emerald-400 font-display">
                      {profileData?.stats?.completedTasks ?? 0}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#090d1f] border border-white/[0.06] text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 text-violet-400 text-[10px] font-mono uppercase font-bold">
                      <Zap className="w-3 h-3 text-violet-400" /> In Progress
                    </div>
                    <p className="text-lg font-extrabold text-violet-400 font-display">
                      {profileData?.stats?.inProgressTasks ?? 0}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#090d1f] border border-white/[0.06] text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 text-cyan-400 text-[10px] font-mono uppercase font-bold">
                      <FolderKanban className="w-3 h-3 text-cyan-400" /> Projects
                    </div>
                    <p className="text-lg font-extrabold text-cyan-400 font-display">
                      {profileData?.stats?.projectsCount ?? (profileData?.projects?.length || 1)}
                    </p>
                  </div>
                </div>

                {/* ── 4. About & Details Section ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                      ABOUT
                    </h3>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.06] space-y-3.5 text-xs sm:text-sm">
                    {/* Bio */}
                    <div className="text-slate-300 leading-relaxed">
                      {user?.bio ? (
                        <>
                          <p className={cn(!isBioExpanded && user.bio.length > 160 && "line-clamp-3")}>
                            {user.bio}
                          </p>
                          {user.bio.length > 160 && (
                            <button
                              type="button"
                              onClick={() => setIsBioExpanded(!isBioExpanded)}
                              className="mt-1.5 text-violet-400 hover:text-violet-300 text-xs font-semibold underline underline-offset-4"
                            >
                              {isBioExpanded ? "Show less" : "Read more"}
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-slate-500 italic">No bio added yet.</p>
                      )}
                    </div>

                    {/* Metadata Grid (Location, Website, Timezone) */}
                    <div className="pt-3 border-t border-white/[0.04] grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {/* Location */}
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">
                          {user?.location || (
                            <span className="text-slate-600">Location not added</span>
                          )}
                        </span>
                      </div>

                      {/* Website */}
                      <div className="flex items-center gap-2 text-slate-400">
                        <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        {user?.website ? (
                          <a
                            href={
                              user.website.startsWith("http")
                                ? user.website
                                : `https://${user.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 hover:underline inline-flex items-center gap-1 truncate"
                          >
                            <span className="truncate">{user.website.replace(/^https?:\/\//, "")}</span>
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-600">Website not added</span>
                        )}
                      </div>

                      {/* Timezone */}
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">Timezone: {user?.timezone || "UTC"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 5. Current Work (Assigned Tasks) ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                      CURRENT WORK
                    </h3>
                    <span className="font-mono text-[10px] text-slate-500 font-semibold">
                      {profileData?.assignedTasks?.length || 0} active
                    </span>
                  </div>

                  {!profileData?.assignedTasks || profileData.assignedTasks.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#090d1f] border border-white/[0.06] text-center space-y-1">
                      <p className="text-xs font-semibold text-slate-400">No active tasks assigned</p>
                      <p className="text-[11px] text-slate-600">
                        This member does not currently have tasks assigned in shared workspaces.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {profileData.assignedTasks.map((task) => {
                        const statusColor = STATUS_COLORS[task.status] || "#64748b";
                        const statusLabel = STATUS_LABELS[task.status] || task.status;

                        return (
                          <div
                            key={task._id}
                            onClick={() => {
                              if (task.project?._id) {
                                router.push(`/dashboard/projects/${task.project._id}/board`);
                                onClose();
                              }
                            }}
                            className="p-3.5 rounded-2xl bg-[#090d1f] border border-white/[0.06] hover:border-violet-500/30 hover:bg-white/[0.02] transition-all cursor-pointer group space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                                {task.title}
                              </h4>

                              {/* Priority badge */}
                              {task.priority && (
                                <span
                                  className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border capitalize flex-shrink-0"
                                  style={{
                                    color: PRIORITY_COLORS[task.priority] || "#94a3b8",
                                    borderColor: `${PRIORITY_COLORS[task.priority] || "#94a3b8"}30`,
                                    backgroundColor: `${PRIORITY_COLORS[task.priority] || "#94a3b8"}10`,
                                  }}
                                >
                                  {task.priority}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                              {/* Project info */}
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: task.project?.color || "#6366f1" }}
                                />
                                <span className="text-slate-400 font-medium truncate">
                                  {task.project?.name || "Project"}
                                </span>
                              </div>

                              {/* Status + Due */}
                              <div className="flex items-center gap-2">
                                <span
                                  className="px-2 py-0.5 rounded-full font-semibold capitalize"
                                  style={{
                                    color: statusColor,
                                    backgroundColor: `${statusColor}15`,
                                  }}
                                >
                                  {statusLabel}
                                </span>

                                {task.dueDate && (
                                  <span>{formatDate(task.dueDate, "short")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── 6. Project Memberships ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                      PROJECT MEMBERSHIP
                    </h3>
                  </div>

                  {!profileData?.projects || profileData.projects.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.06] text-center text-xs text-slate-500">
                      No shared projects found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {profileData.projects.map((proj) => (
                        <div
                          key={proj._id}
                          onClick={() => {
                            router.push(`/dashboard/projects/${proj._id}/board`);
                            onClose();
                          }}
                          className="p-3 rounded-2xl bg-[#090d1f] border border-white/[0.06] hover:border-violet-500/30 hover:bg-white/[0.02] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm"
                              style={{ backgroundColor: proj.color || "#6366f1" }}
                            >
                              {proj.key?.slice(0, 2) || "P"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                                {proj.name}
                              </p>
                              <p className="text-[10px] font-mono text-slate-500 capitalize">
                                {proj.type || "scrum"}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06] capitalize flex-shrink-0">
                            {proj.role || "Member"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
