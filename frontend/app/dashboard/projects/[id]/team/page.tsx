"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store/projectStore";
import { useAuthStore } from "@/lib/store/authStore";
import { projectAPI, taskAPI, sprintAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Crown,
  Shield,
  Eye,
  Users,
  Loader2,
  Search,
  Mail,
  Copy,
  RefreshCw,
  Link2,
  CheckCircle2,
  LogIn,
  Zap,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  ArrowRight,
  Sparkles,
  Check,
  Calendar,
  Layers,
  Settings,
} from "lucide-react";
import { generateAvatar, formatDate, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { InviteMemberModal } from "@/components/team/InviteMemberModal";
import { ManageMemberModal } from "@/components/team/ManageMemberModal";

const ROLE_ICONS = { admin: Crown, member: Shield, viewer: Eye } as const;
const ROLE_BADGES = {
  admin: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  member: "text-violet-400 bg-violet-500/10 border-violet-500/25",
  viewer: "text-slate-400 bg-slate-500/10 border-slate-500/25",
} as const;

export default function TeamPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentProject, fetchProject, joinWithCode } = useProjectStore();
  const { user: currentUser } = useAuthStore();

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [managingMember, setManagingMember] = useState<any | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "online" | "admin" | "member">("all");

  // Real-time presence
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  // Project tasks & active sprint context
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeSprint, setActiveSprint] = useState<any | null>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  // Join-code state
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Refresh pending invites
  const refreshInvites = useCallback(async () => {
    try {
      const res = await projectAPI.getPendingInvites(projectId);
      setPendingInvites(res.data || []);
    } catch {
      setPendingInvites([]);
    }
  }, [projectId]);

  // Load project context (tasks, active sprint, invites)
  useEffect(() => {
    fetchProject(projectId);
    refreshInvites();

    // Fetch tasks to calculate member workloads
    taskAPI
      .getAll({ project: projectId })
      .then((res) => setTasks(res.data || []))
      .catch(() => setTasks([]));

    // Fetch sprints to find active sprint
    sprintAPI
      .getAll(projectId)
      .then((res) => {
        const active = (res.data || []).find((s: any) => s.status === "active");
        setActiveSprint(active || null);
      })
      .catch(() => setActiveSprint(null));
  }, [projectId, fetchProject, refreshInvites]);

  // ── Socket.IO Real-Time Presence & Updates ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !projectId || !currentUser?._id) return;

    // Join the project room and announce presence
    socket.emit("join:project", { projectId, userId: currentUser._id });

    const handlePresenceSync = (data: { onlineUserIds: string[] }) => {
      if (data?.onlineUserIds) setOnlineUserIds(data.onlineUserIds);
    };
    const handlePresenceUpdate = (data: { onlineUserIds: string[] }) => {
      if (data?.onlineUserIds) setOnlineUserIds(data.onlineUserIds);
    };
    const handleMemberJoined = () => {
      fetchProject(projectId);
      refreshInvites();
    };
    const handleMemberUpdated = () => {
      fetchProject(projectId);
    };

    socket.on("presence:sync", handlePresenceSync);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("project:member_joined", handleMemberJoined);
    socket.on("project:member_updated", handleMemberUpdated);

    return () => {
      socket.off("presence:sync", handlePresenceSync);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("project:member_joined", handleMemberJoined);
      socket.off("project:member_updated", handleMemberUpdated);
    };
  }, [projectId, currentUser?._id, fetchProject, refreshInvites]);

  // Calculate current user's role in this project
  const members = currentProject?.members || [];
  const currentMemberRecord = members.find(
    (m: any) => m.user?._id === currentUser?._id || m.user === currentUser?._id
  );
  const isOwner =
    currentProject?.owner?._id === currentUser?._id ||
    currentProject?.owner === currentUser?._id;
  const isAdminOrOwner = isOwner || currentMemberRecord?.role === "admin";

  // Task count per member
  const memberTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.status !== "done" && Array.isArray(t.assignees)) {
        t.assignees.forEach((a: any) => {
          const aId = typeof a === "object" ? a._id : a;
          counts[aId] = (counts[aId] || 0) + 1;
        });
      }
    });
    return counts;
  }, [tasks]);

  // Online count
  const onlineCount = useMemo(() => {
    return members.filter((m: any) => onlineUserIds.includes(m.user?._id)).length;
  }, [members, onlineUserIds]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member: any) => {
      const u = member.user;
      if (!u) return false;

      // Text search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Filter tabs
      if (activeFilter === "online") return onlineUserIds.includes(u._id);
      if (activeFilter === "admin") return member.role === "admin";
      if (activeFilter === "member") return member.role === "member";
      return true;
    });
  }, [members, searchQuery, activeFilter, onlineUserIds]);

  // ── Join Code Actions ──
  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      await projectAPI.generateJoinCode(projectId);
      toast.success("New join code generated! 🚀");
      fetchProject(projectId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate code");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleDisableCode = async () => {
    if (!confirm("Disable this join code? New members won't be able to join using it."))
      return;
    try {
      await projectAPI.disableJoinCode(projectId);
      toast.success("Join code disabled");
      fetchProject(projectId);
    } catch {
      toast.error("Failed to disable code");
    }
  };

  const copyCode = () => {
    if (!currentProject?.joinCode) return;
    navigator.clipboard.writeText(currentProject.joinCode);
    setCodeCopied(true);
    toast.success("Join code copied to clipboard!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const copyJoinLink = () => {
    if (!currentProject?.joinCode) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const joinUrl = `${origin}/join?code=${currentProject.joinCode}`;
    navigator.clipboard.writeText(joinUrl);
    setLinkCopied(true);
    toast.success("Direct join link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleJoinAnotherProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinInput.trim().toUpperCase();
    if (!cleanCode) return;
    setIsJoining(true);
    try {
      const res = await joinWithCode(cleanCode);
      toast.success(res?.message || "Successfully joined project! 🎉");
      setJoinInput("");
      fetchProject(projectId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Invalid or expired code");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* ── 1. PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: currentProject?.color || "#6366f1" }}
            >
              {currentProject?.key?.charAt(0) || "T"}
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              {currentProject?.name || "PROJECT"}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              {members.length} member{members.length === 1 ? "" : "s"}
            </span>
            {onlineCount > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {onlineCount} online
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Team
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Build together. Manage your engineering team, access roles, and permissions.
          </p>
        </div>

        {isAdminOrOwner && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(124,92,255,0.35)] hover:shadow-[0_0_28px_rgba(124,92,255,0.55)] transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* ── 2. TEAM OVERVIEW METRICS STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Team Members
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white">{members.length}</span>
            <span className="text-xs text-slate-500 font-mono">collaborators</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Online Now
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {onlineCount}
            </span>
            <span className="text-xs text-slate-500 font-mono">active sockets</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Pending Invites
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400">
              {pendingInvites.length}
            </span>
            <span className="text-xs text-slate-500 font-mono">awaiting join</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] shadow-sm">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Your Project Role
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {isOwner ? (
              <span className="text-xs font-mono font-bold uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> Owner
              </span>
            ) : (
              <span
                className={cn(
                  "text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1",
                  ROLE_BADGES[currentMemberRecord?.role as keyof typeof ROLE_BADGES] ||
                    "text-slate-400 bg-slate-500/10 border-slate-500/20"
                )}
              >
                <Shield className="w-3 h-3" /> {currentMemberRecord?.role || "Member"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. REAL-TIME TEAM PRESENCE STRIP ── */}
      {onlineCount > 0 && (
        <div className="p-4 rounded-2xl bg-[#080c1d] border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Active Team Presence ({onlineCount} online)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {members
              .filter((m: any) => onlineUserIds.includes(m.user?._id))
              .map((m: any) => {
                const u = m.user;
                return (
                  <div
                    key={u._id}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs"
                  >
                    <div className="relative">
                      <img
                        src={u.avatar || generateAvatar(u.name)}
                        alt={u.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#080c1d]" />
                    </div>
                    <span className="text-white font-medium text-xs">{u.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400">Online</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── 4. MAIN TEAM MEMBERS DIRECTORY ── */}
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name or email..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/[0.08] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: `All (${members.length})` },
              { id: "online", label: `Online (${onlineCount})` },
              {
                id: "admin",
                label: `Admins (${members.filter((m: any) => m.role === "admin").length})`,
              },
              {
                id: "member",
                label: `Members (${members.filter((m: any) => m.role === "member").length})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeFilter === f.id
                    ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,92,255,0.4)]"
                    : "bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 border border-white/[0.06]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Members Directory List */}
        {filteredMembers.length === 0 ? (
          <div className="p-10 rounded-3xl bg-[#090d1f] border border-white/[0.08] text-center space-y-2">
            <p className="text-sm font-bold text-white">No teammates found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or filter criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] rounded-3xl border border-white/[0.08] bg-[#090d1f] shadow-lg overflow-hidden">
            {filteredMembers.map((member: any) => {
              const u = member.user;
              const isUserOnline = onlineUserIds.includes(u?._id);
              const RoleIcon = ROLE_ICONS[member.role?.toLowerCase() as keyof typeof ROLE_ICONS] || Shield;
              const activeTaskCount = memberTaskCounts[u?._id] || 0;
              const isMemberOwner = currentProject?.owner?._id === u?._id || currentProject?.owner === u?._id;

              return (
                <div
                  key={u?._id || Math.random()}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Left: Identity */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <img
                        src={u?.avatar || generateAvatar(u?.name || "U")}
                        alt={u?.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-white/[0.1]"
                      />
                      <span
                        className={cn(
                          "absolute -bottom-1 -right-1 w-3 h-3 rounded-full ring-2 ring-[#090d1f]",
                          isUserOnline ? "bg-emerald-500" : "bg-slate-600"
                        )}
                        title={isUserOnline ? "Online now" : "Offline"}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-white truncate">
                          {u?.name}
                        </h3>
                        {currentUser?._id === u?._id && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-400 truncate">
                        {u?.email}
                      </p>
                    </div>
                  </div>

                  {/* Center: Workload & Online Status */}
                  <div className="flex items-center gap-4 sm:gap-6 text-xs font-mono text-slate-400 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          isUserOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                        )}
                      />
                      <span className={isUserOnline ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                        {isUserOnline ? "Online" : "Offline"}
                      </span>
                    </div>

                    <div className="hidden md:flex items-center gap-1 text-slate-400">
                      <span>{activeTaskCount} active task{activeTaskCount === 1 ? "" : "s"}</span>
                    </div>

                    {/* Role Badge */}
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-full border capitalize",
                        isMemberOwner
                          ? "text-amber-400 bg-amber-500/10 border-amber-500/25"
                          : ROLE_BADGES[member.role?.toLowerCase() as keyof typeof ROLE_BADGES] ||
                              "text-slate-400 bg-slate-500/10 border-slate-500/20"
                      )}
                    >
                      <RoleIcon className="w-3.5 h-3.5" />
                      {isMemberOwner ? "Owner" : member.role}
                    </span>

                    {/* Action button */}
                    {isAdminOrOwner && !isMemberOwner && (
                      <button
                        onClick={() => setManagingMember(member)}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. CURRENT SPRINT & TEAM CONTEXT STRIP ── */}
      {activeSprint && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-violet-900/15 via-[#090d1f] to-transparent border border-violet-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-violet-400 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-full">
                Active Sprint Context
              </span>
              <h4 className="text-sm font-bold text-white">{activeSprint.name}</h4>
            </div>
            <p className="text-xs text-slate-400">
              {activeSprint.tasks?.length || 0} total tasks • {activeSprint.velocity || activeSprint.completedPoints || 0} story points load
            </p>
          </div>

          <button
            onClick={() =>
              router.push(`/dashboard/projects/${projectId}/sprints/${activeSprint._id}`)
            }
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
          >
            <span>View Sprint Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── 6. INVITE BY CODE SECTION (Clean & Compact) ── */}
      <div className="p-6 rounded-3xl bg-[#090d1f] border border-white/[0.08] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Invite Teammates by Code
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Anyone with this 6-character code can instantly join {currentProject?.name}.
            </p>
          </div>

          {/* Join code display & actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentProject?.joinCodeEnabled && currentProject?.joinCode ? (
              <>
                <div className="px-4 py-2 bg-[#060914] border border-violet-500/40 rounded-2xl font-mono font-black tracking-widest text-lg text-violet-300 shadow-[0_0_15px_rgba(124,92,255,0.15)] select-all">
                  {currentProject.joinCode}
                </div>

                <button
                  onClick={copyCode}
                  title="Copy Code"
                  className="p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {codeCopied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={copyJoinLink}
                  title="Copy Direct Join Link"
                  className="px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>{linkCopied ? "Link Copied!" : "Copy Link"}</span>
                </button>

                {isAdminOrOwner && (
                  <>
                    <button
                      onClick={handleGenerateCode}
                      disabled={isGeneratingCode}
                      title="Regenerate code"
                      className="p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw
                        className={cn(
                          "w-4 h-4",
                          isGeneratingCode && "animate-spin text-violet-400"
                        )}
                      />
                    </button>
                    <button
                      onClick={handleDisableCode}
                      className="text-xs text-rose-400 hover:underline px-1 cursor-pointer"
                    >
                      Disable
                    </button>
                  </>
                )}
              </>
            ) : (
              isAdminOrOwner && (
                <button
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(124,92,255,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingCode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Generate Join Code</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Join another project helper */}
        <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <LogIn className="w-3.5 h-3.5 text-slate-500" />
            <span>Have a code for another project?</span>
          </p>
          <form
            onSubmit={handleJoinAnotherProject}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <input
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              placeholder="ENTER 6-CHAR CODE..."
              maxLength={8}
              className="px-3 py-1.5 rounded-xl border border-white/[0.08] bg-[#060914] text-white text-xs font-mono tracking-widest uppercase focus:outline-none focus:border-violet-500/70"
            />
            <button
              type="submit"
              disabled={isJoining || joinInput.length < 4}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
            >
              {isJoining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Join"}
            </button>
          </form>
        </div>
      </div>

      {/* ── 7. PENDING INVITATIONS ── */}
      {pendingInvites.length > 0 && (
        <div className="p-6 rounded-3xl bg-[#090d1f] border border-dashed border-white/[0.12] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            <Mail className="w-4 h-4" />
            <span>Pending Invitations ({pendingInvites.length})</span>
          </div>

          <div className="divide-y divide-white/[0.04] bg-[#060914] rounded-2xl border border-white/[0.06] overflow-hidden">
            {pendingInvites.map((invite) => {
              const clientUrl =
                typeof window !== "undefined" ? window.location.origin : "";
              const inviteLink = `${clientUrl}/invite/${invite.token}`;

              return (
                <div
                  key={invite._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-xs flex-shrink-0">
                      {invite.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {invite.email}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        Expires {formatDate(invite.expiresAt, "short")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                      Pending
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 capitalize">
                      {invite.role}
                    </span>
                    {invite.code && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                        Code: {invite.code}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        toast.success("Invite link copied!");
                      }}
                      className="px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-xs font-mono text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Link2 className="w-3 h-3" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        projectId={projectId}
        projectName={currentProject?.name}
        projectColor={currentProject?.color}
        existingMemberIds={members.map((m: any) => m.user?._id)}
        onInviteSent={() => {
          fetchProject(projectId);
          refreshInvites();
        }}
      />

      <ManageMemberModal
        isOpen={!!managingMember}
        onClose={() => setManagingMember(null)}
        projectId={projectId}
        member={managingMember}
        isOwner={isOwner}
        currentUserId={currentUser?._id}
        onMemberUpdated={() => fetchProject(projectId)}
        onMemberRemoved={() => fetchProject(projectId)}
      />
    </div>
  );
}
