"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Trash2,
  UserPlus,
  Zap,
  MessageSquare,
  GitPullRequest,
  AlertCircle,
  Users,
  BellRing,
  Bug,
  BookOpen,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  FolderKanban,
  AtSign,
  Clock,
  Sparkles,
  PhoneMissed,
  PhoneCall,
} from "lucide-react";
import { generateAvatar, formatDate, cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { getStatusConfig } from "@/lib/statusConfig";
import { useProjectStore } from "@/lib/store/projectStore";
import toast from "react-hot-toast";

export interface NotificationItem {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<any>;
    label: string;
    color: string;
    bg: string;
    border: string;
    badgeColor: string;
  }
> = {
  project_invite: {
    icon: UserPlus,
    label: "Invitation",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    badgeColor: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  user_joined: {
    icon: Users,
    label: "Team",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  task_assigned: {
    icon: Zap,
    label: "Assignment",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  task_updated: {
    icon: Zap,
    label: "Task Update",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  task_status_changed: {
    icon: ArrowRight,
    label: "Status Changed",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/25",
    badgeColor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  },
  comment_added: {
    icon: MessageSquare,
    label: "Comment",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/25",
    badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  mention: {
    icon: AtSign,
    label: "Mention",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/25",
    badgeColor: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  },
  sprint_started: {
    icon: BellRing,
    label: "Sprint Active",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
    badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  sprint_completed: {
    icon: CheckCircle2,
    label: "Sprint Done",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  issue_created: {
    icon: Bug,
    label: "Bug / Issue",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  wiki_updated: {
    icon: BookOpen,
    label: "Wiki Doc",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  pr_linked: {
    icon: GitPullRequest,
    label: "Pull Request",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/25",
    badgeColor: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  },
  call_missed: {
    icon: PhoneMissed,
    label: "Missed Call",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  call_incoming: {
    icon: PhoneCall,
    label: "Incoming Call",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    badgeColor: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
};

export function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: NotificationCardProps) {
  const router = useRouter();
  const { acceptInvite, acceptInviteByCode, fetchProjects } = useProjectStore();
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
  const [inviteAccepted, setInviteAccepted] = useState(false);

  const typeConfig = TYPE_CONFIG[notification.type] || {
    icon: Bell,
    label: "Activity",
    color: "text-slate-400",
    bg: "bg-white/[0.04]",
    border: "border-white/[0.08]",
    badgeColor: "bg-white/[0.06] text-slate-300 border-white/[0.1]",
  };
  const TypeIcon = typeConfig.icon;

  const senderName = notification.sender?.name || "SprintForge Bot";
  const senderAvatar =
    notification.sender?.avatar || generateAvatar(senderName);

  const exactDate = new Date(notification.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const relativeTime = formatDate(notification.createdAt, "relative");

  // Status transition styling if present in data
  const oldStatusConfig = notification.data?.oldStatus
    ? getStatusConfig(notification.data.oldStatus)
    : null;
  const newStatusConfig = notification.data?.newStatus
    ? getStatusConfig(notification.data.newStatus)
    : null;

  // Handle Card Click
  const handleCardClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification._id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Handle Accept Project Invite directly
  const handleAcceptInvite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAcceptingInvite(true);
    try {
      if (notification.data?.inviteToken) {
        await acceptInvite(notification.data.inviteToken);
      } else if (notification.data?.inviteCode) {
        await acceptInviteByCode(notification.data.inviteCode);
      }
      setInviteAccepted(true);
      onMarkRead(notification._id);
      await fetchProjects();
      toast.success("Joined project successfully! 🚀");
      if (notification.data?.projectId) {
        router.push(`/dashboard/projects/${notification.data.projectId}/board`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to accept invitation");
    } finally {
      setIsAcceptingInvite(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, height: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={handleCardClick}
      className={cn(
        "group relative flex items-start gap-3.5 sm:gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden",
        notification.isRead
          ? "bg-[#070b1a]/80 border-white/[0.06] hover:bg-[#090e24] hover:border-white/[0.12]"
          : "bg-gradient-to-r from-violet-600/[0.08] via-[#090e24] to-[#070b1a] border-violet-500/30 hover:border-violet-500/50 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      )}
    >
      {/* ── Unread Vertical Left Indicator ── */}
      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-indigo-500" />
      )}

      {/* ── Actor Avatar with Type Badge Overlay ── */}
      <div className="relative flex-shrink-0 mt-0.5">
        <UserAvatar
          src={notification.sender?.avatar}
          name={senderName}
          size="md"
          ringClassName="ring-2 ring-white/[0.1] group-hover:ring-violet-500/40 transition-all"
        />
        <div
          className={cn(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border border-[#070b1a] shadow-sm",
            typeConfig.bg,
            typeConfig.color
          )}
        >
          <TypeIcon className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Top Header Line: Actor + Type Badge + Timestamp */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs sm:text-sm font-bold text-white group-hover:text-violet-200 transition-colors">
              {senderName}
            </span>

            <span
              className={cn(
                "text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1",
                typeConfig.badgeColor
              )}
            >
              <TypeIcon className="w-2.5 h-2.5" />
              <span>{typeConfig.label}</span>
            </span>

            {notification.data?.projectName && (
              <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.2 rounded flex items-center gap-1">
                <FolderKanban className="w-2.5 h-2.5 text-violet-400" />
                <span>{notification.data.projectName}</span>
              </span>
            )}
          </div>

          <div
            className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 flex-shrink-0"
            title={exactDate}
          >
            <Clock className="w-3 h-3 text-slate-600" />
            <span>{relativeTime}</span>
          </div>
        </div>

        {/* Title / Action Summary */}
        <p
          className={cn(
            "text-xs sm:text-sm leading-relaxed",
            notification.isRead ? "text-slate-300 font-medium" : "text-white font-bold"
          )}
        >
          {notification.title}
        </p>

        {/* Detailed Message Text or Quote */}
        {notification.message && (
          <div
            className={cn(
              "text-xs leading-relaxed font-sans",
              notification.type === "comment_added" || notification.type === "mention"
                ? "p-2.5 rounded-xl bg-white/[0.02] border-l-2 border-violet-500/60 text-slate-300 italic"
                : "text-slate-400"
            )}
          >
            {notification.message}
          </div>
        )}

        {/* ── Rich Context Payload Data ── */}
        {notification.data && (
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            {/* Task Key & Story Points */}
            {notification.data.taskKey && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-violet-300">
                {notification.data.taskKey}
              </span>
            )}

            {/* Status Transition Badges */}
            {oldStatusConfig && newStatusConfig && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded border",
                    oldStatusConfig.badgeStyle
                  )}
                >
                  {oldStatusConfig.shortLabel}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded border",
                    newStatusConfig.badgeStyle
                  )}
                >
                  {newStatusConfig.shortLabel}
                </span>
              </div>
            )}

            {/* Priority */}
            {notification.data.priority && (
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {notification.data.priority}
              </span>
            )}
          </div>
        )}

        {/* ── Interactive CTA Actions (e.g. Project Invitation or Open Link) ── */}
        {notification.type === "project_invite" && (
          <div className="pt-2 flex items-center gap-2">
            {inviteAccepted ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Joined Workspace</span>
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAcceptInvite}
                  disabled={isAcceptingInvite}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(124,92,255,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAcceptingInvite ? "Joining..." : "Accept Invitation"}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification._id);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-white/[0.1] hover:bg-white/[0.04] text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Decline
                </button>
              </>
            )}
          </div>
        )}

        {notification.link && notification.type !== "project_invite" && (
          <div className="pt-1 flex items-center gap-1 text-xs font-bold text-violet-400 group-hover:text-violet-300 transition-colors">
            <span>
              {notification.type === "task_assigned" || notification.type === "task_updated"
                ? "Open Task"
                : notification.type === "comment_added" || notification.type === "mention"
                ? "View Comment"
                : notification.type === "sprint_started"
                ? "View Sprint"
                : "View Details"}
            </span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
          </div>
        )}
      </div>

      {/* ── Right Quick Actions on Hover ── */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <button
            type="button"
            title="Mark as read"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification._id);
            }}
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-violet-600/20 text-slate-400 hover:text-violet-300 border border-white/[0.06] hover:border-violet-500/40 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          title="Remove notification"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
          className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/[0.06] hover:border-rose-500/40 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Unread Glow Dot (Top right) ── */}
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(124,92,255,0.8)] flex-shrink-0 mt-1" />
      )}
    </motion.div>
  );
}
