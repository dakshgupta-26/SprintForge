"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BellOff,
  CheckCircle2,
  AtSign,
  Zap,
  FolderKanban,
  MessageSquare,
  Bug,
} from "lucide-react";

interface NotificationEmptyStateProps {
  filter: string;
}

const EMPTY_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    badge: string;
  }
> = {
  all: {
    icon: CheckCircle2,
    title: "You're all caught up!",
    description:
      "No notifications found. Stay tuned for new task assignments, mentions, and project updates.",
    badge: "Inbox Zero 🎉",
  },
  unread: {
    icon: CheckCircle2,
    title: "All caught up on unread items!",
    description:
      "You have reviewed all incoming notifications across your projects and workspaces.",
    badge: "Clean Inbox ✨",
  },
  mentions: {
    icon: AtSign,
    title: "No mentions yet",
    description:
      "When teammates @mention you in comments, tickets, or discussions, they will appear here.",
    badge: "@Mentions",
  },
  tasks: {
    icon: Zap,
    title: "No task activity",
    description:
      "Work item assignments, status transitions, and deadline alerts will populate here.",
    badge: "Work Items",
  },
  projects: {
    icon: FolderKanban,
    title: "No project invitations or events",
    description:
      "New project invitations and workspace member updates will be cataloged here.",
    badge: "Workspaces",
  },
  comments: {
    icon: MessageSquare,
    title: "No comment notifications",
    description:
      "Conversations and comment replies on tasks and docs will be listed here.",
    badge: "Discussions",
  },
  issues: {
    icon: Bug,
    title: "No bug tracker alerts",
    description:
      "Issues assigned to you or marked as resolved will show up in this feed.",
    badge: "Issues",
  },
};

export function NotificationEmptyState({ filter }: NotificationEmptyStateProps) {
  const config = EMPTY_CONFIG[filter] || EMPTY_CONFIG.all;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-3xl bg-[#090d1f]/60 border border-white/[0.06] shadow-sm my-4"
    >
      <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400 shadow-inner">
        <Icon className="w-6 h-6" />
      </div>

      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/[0.04] text-violet-300 border border-white/[0.08] mb-2">
        {config.badge}
      </span>

      <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
        {config.title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
        {config.description}
      </p>
    </motion.div>
  );
}
