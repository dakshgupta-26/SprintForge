"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Users,
  Shield,
  History,
  AlertTriangle,
  Upload,
  Trash2,
  Check,
  Loader2,
  Copy,
  RefreshCw,
  Crown,
  UserX,
  Search,
  Lock,
  Globe,
  Sliders,
  Sparkles,
  ChevronRight,
  Eye,
  Layers,
  ArrowRight,
} from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
import { useProjectStore, Project, ProjectMember } from "@/lib/store/projectStore";
import { useAuthStore } from "@/lib/store/authStore";
import { projectAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { ProjectAvatar } from "@/components/shared/ProjectAvatar";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ProjectImageCropModal } from "@/components/projects/ProjectImageCropModal";
import { ProjectDeleteModal } from "@/components/projects/ProjectDeleteModal";
import { TransferOwnershipModal } from "@/components/projects/TransferOwnershipModal";
import { InviteMemberModal } from "@/components/team/InviteMemberModal";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface ProjectSettingsViewProps {
  projectId: string;
}

type TabType = "general" | "members" | "permissions" | "integrations" | "activity" | "danger";

export function ProjectSettingsView({ projectId }: ProjectSettingsViewProps) {
  const { currentProject, fetchProject, updateProject, removeImage } = useProjectStore();
  const { user: currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modals state
  const [showCropModal, setShowCropModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Form State (General)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"scrum" | "kanban">("scrum");
  const [isPrivate, setIsPrivate] = useState(false);
  const [color, setColor] = useState("#6366f1");

  // Permissions Settings State
  const [allowAdminMemberManagement, setAllowAdminMemberManagement] = useState(true);
  const [allowAdminProjectEdit, setAllowAdminProjectEdit] = useState(true);

  // Members filter & management
  const [memberSearch, setMemberSearch] = useState("");
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<ProjectMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Role change modal state
  const [memberToChangeRole, setMemberToChangeRole] = useState<ProjectMember | null>(null);
  const [newRoleForMember, setNewRoleForMember] = useState<"admin" | "member">("member");
  const [isChangingRole, setIsChangingRole] = useState(false);

  // Join Code state
  const [joinCode, setJoinCode] = useState("");
  const [joinCodeEnabled, setJoinCodeEnabled] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Activity logs
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Sync state with currentProject
  useEffect(() => {
    if (currentProject) {
      setName(currentProject.name || "");
      setDescription(currentProject.description || "");
      setType(currentProject.type || "scrum");
      setIsPrivate(Boolean(currentProject.isPrivate));
      setColor(currentProject.color || "#6366f1");
      setJoinCode(currentProject.joinCode || "");
      setJoinCodeEnabled(Boolean(currentProject.joinCodeEnabled));

      setAllowAdminMemberManagement(
        currentProject.settings?.allowAdminMemberManagement ?? true
      );
      setAllowAdminProjectEdit(
        currentProject.settings?.allowAdminProjectEdit ?? true
      );
    }
  }, [currentProject]);

  // Load project on mount
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId, fetchProject]);

  // Real-time socket presence & updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !projectId) return;

    socket.emit("join:project", { projectId, userId: currentUser?._id });

    const handlePresenceSync = (data: { onlineUserIds: string[] }) => {
      if (data?.onlineUserIds) setOnlineUserIds(data.onlineUserIds);
    };
    const handlePresenceUpdate = (data: { onlineUserIds: string[] }) => {
      if (data?.onlineUserIds) setOnlineUserIds(data.onlineUserIds);
    };
    const handleMemberUpdated = () => {
      fetchProject(projectId);
    };

    socket.on("presence:sync", handlePresenceSync);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("project:member_updated", handleMemberUpdated);
    socket.on("project:member_joined", handleMemberUpdated);

    return () => {
      socket.off("presence:sync", handlePresenceSync);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("project:member_updated", handleMemberUpdated);
      socket.off("project:member_joined", handleMemberUpdated);
    };
  }, [projectId, currentUser?._id, fetchProject]);

  // Load activities when activity tab is active
  useEffect(() => {
    if (activeTab === "activity" && projectId) {
      setIsLoadingActivities(true);
      projectAPI
        .getActivity(projectId, 1, 40)
        .then((res) => {
          setActivities(res.data.activities || []);
        })
        .catch(() => setActivities([]))
        .finally(() => setIsLoadingActivities(false));
    }
  }, [activeTab, projectId]);

  // Authorization checks
  const isOwner = useMemo(() => {
    if (!currentProject || !currentUser?._id) return false;
    const ownerId = String(currentProject.owner?._id || currentProject.owner);
    return ownerId === String(currentUser._id);
  }, [currentProject, currentUser]);

  const isAdminOrOwner = useMemo(() => {
    if (isOwner) return true;
    const memberEntry = currentProject?.members?.find(
      (m: any) => String(m.user?._id || m.user) === String(currentUser?._id)
    );
    return (memberEntry?.role || "").toLowerCase() === "admin";
  }, [isOwner, currentProject, currentUser]);

  // Save general settings
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name cannot be empty");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateProject(projectId, {
        name: name.trim(),
        description: description.trim(),
        type,
        isPrivate,
        color,
        settings: {
          allowAdminMemberManagement,
          allowAdminProjectEdit,
        },
      });

      setSaveSuccess(true);
      toast.success("Project settings saved ✨");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update project settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Remove Project Image
  const handleRemoveImage = async () => {
    try {
      await removeImage(projectId);
      toast.success("Project avatar removed");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove avatar");
    }
  };

  // Generate / Disable Join Code
  const handleToggleJoinCode = async () => {
    setIsGeneratingCode(true);
    try {
      if (joinCodeEnabled) {
        await projectAPI.disableJoinCode(projectId);
        setJoinCodeEnabled(false);
        toast.success("Join code disabled");
      } else {
        const res = await projectAPI.generateJoinCode(projectId);
        setJoinCode(res.data.joinCode);
        setJoinCodeEnabled(true);
        toast.success("New join code activated");
      }
      fetchProject(projectId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update join code");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Handle Remove Member
  const handleConfirmRemoveMember = async () => {
    if (!selectedMemberToRemove) return;
    setIsRemovingMember(true);
    try {
      await projectAPI.removeMember(projectId, selectedMemberToRemove.user._id);
      toast.success(`${selectedMemberToRemove.user.name} removed from project`);
      setSelectedMemberToRemove(null);
      fetchProject(projectId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove member");
    } finally {
      setIsRemovingMember(false);
    }
  };

  // Handle Change Member Role
  const handleConfirmChangeRole = async () => {
    if (!memberToChangeRole) return;
    setIsChangingRole(true);
    try {
      await projectAPI.updateMemberRole(projectId, memberToChangeRole.user._id, {
        role: newRoleForMember,
      });
      toast.success(`Role updated to ${newRoleForMember.toUpperCase()}`);
      setMemberToChangeRole(null);
      fetchProject(projectId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update role");
    } finally {
      setIsChangingRole(false);
    }
  };

  // Filtered members
  const membersList = currentProject?.members || [];
  const filteredMembers = useMemo(() => {
    return membersList.filter((m) => {
      const q = memberSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        m.user?.name?.toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q)
      );
    });
  }, [membersList, memberSearch]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-3.5">
          <ProjectAvatar project={currentProject} size="xl" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentProject?.name || "Project Settings"}
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-violet-300 border border-white/[0.08]">
                {currentProject?.key || "KEY"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Project identity, team access, permission controls, and system settings
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Project Owner</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-white/[0.06] pb-2">
        <button
          onClick={() => setActiveTab("general")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeTab === "general"
              ? "bg-violet-600/15 text-white border border-violet-500/30 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeTab === "members"
              ? "bg-violet-600/15 text-white border border-violet-500/30 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.08]">
            {membersList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("permissions")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeTab === "permissions"
              ? "bg-violet-600/15 text-white border border-violet-500/30 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Permissions</span>
        </button>

        <button
          onClick={() => setActiveTab("integrations")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeTab === "integrations"
              ? "bg-violet-600/15 text-white border border-violet-500/30 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <GithubIcon className="w-3.5 h-3.5" />
          <span>Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeTab === "activity"
              ? "bg-violet-600/15 text-white border border-violet-500/30 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <History className="w-3.5 h-3.5" />
          <span>Activity</span>
        </button>

        <button
          onClick={() => setActiveTab("danger")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ml-auto",
            activeTab === "danger"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* ── TAB 1: GENERAL ── */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          {/* Card 1: Project Identity */}
          <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono text-slate-400">
              Project Identity
            </h3>

            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-2xl bg-[#060914] border border-white/[0.06]">
              <ProjectAvatar project={currentProject} size="2xl" />
              <div className="space-y-1.5 flex-1">
                <h4 className="text-sm font-bold text-white">Project Avatar</h4>
                <p className="text-xs text-slate-400">
                  Custom avatar shown across the sidebar, switcher, boards, and notifications.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCropModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-xs font-bold text-violet-300 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>

                  {currentProject?.imageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Name & Key */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500 text-sm font-medium text-white outline-none transition-all"
                  placeholder="e.g. SprintForge Core"
                  maxLength={60}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Project Key
                </label>
                <input
                  type="text"
                  disabled
                  value={currentProject?.key || ""}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#04060d] border border-white/[0.06] text-sm font-mono font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Project Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500 text-xs font-sans text-white outline-none transition-all"
                placeholder="Brief summary of your project goals..."
                maxLength={400}
              />
              <p className="text-[10px] text-slate-500 text-right font-mono">
                {description.length} / 400
              </p>
            </div>
          </div>

          {/* Card 2: Configuration */}
          <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono text-slate-400">
              Project Configuration
            </h3>

            {/* Project Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setType("scrum")}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3",
                  type === "scrum"
                    ? "bg-violet-600/10 border-violet-500/40 text-white shadow-sm"
                    : "bg-[#060914] border-white/[0.06] text-slate-400 hover:border-white/[0.12]"
                )}
              >
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Scrum Workflow</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sprint planning, backlog estimations, sprint cycles, and burndown charts.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setType("kanban")}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3",
                  type === "kanban"
                    ? "bg-violet-600/10 border-violet-500/40 text-white shadow-sm"
                    : "bg-[#060914] border-white/[0.06] text-slate-400 hover:border-white/[0.12]"
                )}
              >
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Kanban Workflow</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Continuous flow task board, work-in-progress limits, and cycle time tracking.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Join Code */}
            <div className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white">Project Join Code</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Allow team members to instantly join via the <code>/join</code> page using a short 6-digit code.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {joinCodeEnabled && joinCode && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/30">
                    <span className="font-mono font-bold text-sm text-violet-300 tracking-wider">
                      {joinCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(joinCode);
                        toast.success("Join code copied to clipboard");
                      }}
                      className="p-1 hover:text-white text-slate-400 rounded-md transition-colors"
                      title="Copy code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleToggleJoinCode}
                  disabled={isGeneratingCode}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  {isGeneratingCode ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : joinCodeEnabled ? (
                    "Disable Code"
                  ) : (
                    "Enable Code"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Check className="w-4 h-4" /> Changes saved successfully
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(124,92,255,0.35)] disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 2: MEMBERS ── */}
      {activeTab === "members" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members by name, email or role..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#090d20] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Transfer Ownership</span>
                </button>
              )}

              {isAdminOrOwner && (
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Invite Member</span>
                </button>
              )}
            </div>
          </div>

          {/* Members List */}
          <div className="rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl overflow-hidden divide-y divide-white/[0.06]">
            {filteredMembers.map((member) => {
              const u = member.user;
              if (!u) return null;

              const isUserOwner = String(currentProject?.owner?._id || currentProject?.owner) === String(u._id);
              const isOnline = onlineUserIds.includes(String(u._id));
              const isSelf = String(currentUser?._id) === String(u._id);

              return (
                <div
                  key={u._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <UserAvatar
                        user={u}
                        size="md"
                        showOnlineIndicator={false}
                      />
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#090d20]",
                          isOnline ? "bg-emerald-400" : "bg-slate-600"
                        )}
                        title={isOnline ? "Online" : "Offline"}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white truncate">{u.name}</p>
                        {isSelf && (
                          <span className="text-[10px] font-mono text-slate-500">(You)</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  {/* Right: Role + Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* Role badge */}
                    {isUserOwner ? (
                      <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>Project Owner</span>
                      </span>
                    ) : member.role === "admin" ? (
                      <span className="text-[11px] font-mono font-bold text-violet-300 bg-violet-500/10 border border-violet-500/25 px-2.5 py-1 rounded-full">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
                        Member
                      </span>
                    )}

                    {/* Joined Date */}
                    <span className="text-[10px] font-mono text-slate-500 hidden md:inline-block">
                      Joined {formatDate(member.joinedAt || new Date().toISOString())}
                    </span>

                    {/* Actions Menu (Owner only) */}
                    {isOwner && !isUserOwner && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setMemberToChangeRole(member);
                            setNewRoleForMember(member.role === "admin" ? "member" : "admin");
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                          title="Change member role"
                        >
                          Change Role
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedMemberToRemove(member)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: PERMISSIONS ── */}
      {activeTab === "permissions" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono text-slate-400">
              Role Permission Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Permission</th>
                    <th className="py-2.5 px-3 text-center">Owner</th>
                    <th className="py-2.5 px-3 text-center">Admin</th>
                    <th className="py-2.5 px-3 text-center">Member</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-slate-300">
                  <tr>
                    <td className="py-3 px-3 font-medium">View Project, Boards & Tasks</td>
                    <td className="py-3 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-3 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-3 px-3 text-center text-emerald-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium">Create & Edit Tasks, Issues & Sprints</td>
                    <td className="py-3 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-3 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-3 px-3 text-center text-emerald-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium">Edit Project Details & Settings</td>
                    <td className="py-3 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-3 px-3 text-center text-amber-300">
                      {allowAdminProjectEdit ? "✓ (Allowed)" : "✗ (Restricted)"}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">✗</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium">Invite & Remove Members</td>
                    <td className="py-3 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-3 px-3 text-center text-amber-300">
                      {allowAdminMemberManagement ? "✓ (Allowed)" : "✗ (Restricted)"}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">✗</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium">Change Member Roles</td>
                    <td className="py-3 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-3 px-3 text-center text-slate-600">✗</td>
                    <td className="py-3 px-3 text-center text-slate-600">✗</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium">Transfer Project Ownership</td>
                    <td className="py-3 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-3 px-3 text-center text-slate-600">✗</td>
                    <td className="py-3 px-3 text-center text-slate-600">✗</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium text-rose-300 font-bold">Permanently Delete Project</td>
                    <td className="py-3 px-3 text-center text-rose-400 font-bold">✓ (Owner Only)</td>
                    <td className="py-3 px-3 text-center text-slate-600 font-bold">✗</td>
                    <td className="py-3 px-3 text-center text-slate-600 font-bold">✗</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Owner Permission Configuration Controls */}
            {isOwner && (
              <div className="pt-4 border-t border-white/[0.08] space-y-4">
                <h4 className="text-xs font-bold text-white uppercase font-mono">
                  Owner Controls over Admins
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#060914] border border-white/[0.06] cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-white">Allow Admins to Edit Project Details</p>
                      <p className="text-[11px] text-slate-400">
                        When disabled, only the project owner can change project name, description, or image.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowAdminProjectEdit}
                      onChange={(e) => setAllowAdminProjectEdit(e.target.checked)}
                      className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#060914] border border-white/[0.06] cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-white">Allow Admins to Manage Members</p>
                      <p className="text-[11px] text-slate-400">
                        When disabled, only the project owner can invite or remove members.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowAdminMemberManagement}
                      onChange={(e) => setAllowAdminMemberManagement(e.target.checked)}
                      className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveGeneral}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Save Permission Rules
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: INTEGRATIONS ── */}
      {activeTab === "integrations" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-white">
                <GithubIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">GitHub Integration</h3>
                <p className="text-xs text-slate-400">
                  Connect branches and commit history to this SprintForge project
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">Linked Repository:</span>
                <span className="text-xs font-mono font-bold text-violet-300">
                  {currentProject?.githubRepo || "Not linked"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 space-y-1">
              <p className="font-bold text-violet-200">Repository Isolation Guarantee</p>
              <p className="text-[11px] text-violet-300/80 leading-relaxed">
                SprintForge links to your repository for branch awareness, live collaborative coding, and task tracking.
                Deleting or modifying this SprintForge project will <strong>never delete or alter your remote GitHub repository</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: ACTIVITY ── */}
      {activeTab === "activity" && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono text-slate-400">
              Project Audit Log
            </h3>

            {isLoadingActivities ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading activity stream...</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                No recent activity recorded
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {activities.map((act) => (
                  <div key={act._id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar user={act.actor} size="sm" />
                      <div>
                        <p className="font-medium text-slate-200">
                          {act.details}
                        </p>
                        <span className="text-[10px] font-mono text-slate-500">
                          {act.action}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 6: DANGER ZONE ── */}
      {activeTab === "danger" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#12080e] border border-rose-500/30 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Danger Zone</h3>
                <p className="text-xs text-rose-300/70">
                  Irreversible, permanent actions for this project
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#080205] border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Delete this project</h4>
                <p className="text-xs text-slate-400 max-w-lg">
                  Permanently delete <strong>{currentProject?.name}</strong> and all its associated
                  tasks, sprints, issues, chats, calls, and workspace data. This action cannot be undone.
                </p>
              </div>

              {isOwner ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.35)] cursor-pointer flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Project</span>
                </button>
              ) : (
                <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-400">
                  Owner authorization required
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <ProjectImageCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        projectId={projectId}
        projectName={currentProject?.name || "Project"}
        onImageUpdated={() => fetchProject(projectId)}
      />

      <ProjectDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        projectId={projectId}
        projectName={currentProject?.name || "Project"}
      />

      <TransferOwnershipModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        projectId={projectId}
        projectName={currentProject?.name || "Project"}
        members={membersList}
        currentOwnerId={String(currentProject?.owner?._id || currentProject?.owner)}
        onTransferred={() => fetchProject(projectId)}
      />

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        projectId={projectId}
        projectName={currentProject?.name || "Project"}
        onInviteSent={() => fetchProject(projectId)}
      />

      {/* ── REMOVE MEMBER CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {selectedMemberToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#090d20] border border-white/[0.12] rounded-3xl p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-bold text-white">
                Remove {selectedMemberToRemove.user?.name} from {currentProject?.name}?
              </h3>
              <p className="text-xs text-slate-300">
                They will immediately lose access to:
              </p>
              <div className="grid grid-cols-2 gap-1.5 p-3 rounded-xl bg-[#060914] text-[11px] font-mono text-slate-400">
                <span>• Board & Backlog</span>
                <span>• Sprints & Velocity</span>
                <span>• Impact & Issues</span>
                <span>• Team Chat & Calls</span>
                <span>• Code Workspace</span>
                <span>• Wiki & Analytics</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberToRemove(null)}
                  disabled={isRemovingMember}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoveMember}
                  disabled={isRemovingMember}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isRemovingMember ? "Removing..." : "Remove Member"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CHANGE MEMBER ROLE MODAL ── */}
      <AnimatePresence>
        {memberToChangeRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#090d20] border border-white/[0.12] rounded-3xl p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-bold text-white">
                Change role for {memberToChangeRole.user?.name}?
              </h3>
              <p className="text-xs text-slate-300">
                Current Role:{" "}
                <span className="font-bold text-violet-400 uppercase font-mono">
                  {memberToChangeRole.role}
                </span>
              </p>

              <div className="space-y-2">
                <label
                  onClick={() => setNewRoleForMember("admin")}
                  className={cn(
                    "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors",
                    newRoleForMember === "admin"
                      ? "bg-violet-600/15 border-violet-500/40 text-white"
                      : "bg-[#060914] border-white/[0.06] text-slate-400 hover:text-white"
                  )}
                >
                  <div>
                    <p className="text-xs font-bold text-white">Admin</p>
                    <p className="text-[10px] text-slate-400">Can manage members & sprint tasks</p>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    checked={newRoleForMember === "admin"}
                    onChange={() => setNewRoleForMember("admin")}
                    className="accent-violet-500"
                  />
                </label>

                <label
                  onClick={() => setNewRoleForMember("member")}
                  className={cn(
                    "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors",
                    newRoleForMember === "member"
                      ? "bg-violet-600/15 border-violet-500/40 text-white"
                      : "bg-[#060914] border-white/[0.06] text-slate-400 hover:text-white"
                  )}
                >
                  <div>
                    <p className="text-xs font-bold text-white">Member</p>
                    <p className="text-[10px] text-slate-400">Can contribute to tasks, issues, and docs</p>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    checked={newRoleForMember === "member"}
                    onChange={() => setNewRoleForMember("member")}
                    className="accent-violet-500"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMemberToChangeRole(null)}
                  disabled={isChangingRole}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmChangeRole}
                  disabled={isChangingRole}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isChangingRole ? "Saving..." : "Save Role"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
