import {
  Circle,
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  LucideIcon,
} from "lucide-react";

export interface StatusConfigItem {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  dotColor: string;
  borderClass: string;
  activeBorderClass: string;
  cardGlow: string;
  cardBg: string;
  badgeStyle: string;
  indicatorIcon: LucideIcon;
  dropZoneBg: string;
  dropZoneBorder: string;
  isDone?: boolean;
}

export const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  todo: {
    id: "todo",
    label: "To Do",
    shortLabel: "TODO",
    color: "#94a3b8",
    dotColor: "bg-slate-400",
    borderClass: "border-slate-700/60 hover:border-slate-500/60",
    activeBorderClass: "border-slate-400/80 shadow-[0_0_15px_rgba(148,163,184,0.15)]",
    cardGlow: "rgba(148,163,184,0.06)",
    cardBg: "bg-[#090d1f]",
    badgeStyle: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    indicatorIcon: Circle,
    dropZoneBg: "bg-slate-500/[0.04]",
    dropZoneBorder: "border-slate-500/30",
  },
  in_progress: {
    id: "in_progress",
    label: "In Progress",
    shortLabel: "PROGRESS",
    color: "#6366f1",
    dotColor: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]",
    borderClass: "border-indigo-500/25 hover:border-indigo-500/55",
    activeBorderClass: "border-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,0.25)]",
    cardGlow: "rgba(99,102,241,0.12)",
    cardBg: "bg-gradient-to-b from-[#0c1228] to-[#090d1f]",
    badgeStyle: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    indicatorIcon: PlayCircle,
    dropZoneBg: "bg-indigo-500/[0.08]",
    dropZoneBorder: "border-indigo-500/40",
  },
  review: {
    id: "review",
    label: "In Review",
    shortLabel: "REVIEW",
    color: "#a855f7",
    dotColor: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    borderClass: "border-purple-500/25 hover:border-purple-500/55",
    activeBorderClass: "border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.25)]",
    cardGlow: "rgba(168,85,247,0.12)",
    cardBg: "bg-gradient-to-b from-[#100e26] to-[#090d1f]",
    badgeStyle: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    indicatorIcon: Clock,
    dropZoneBg: "bg-purple-500/[0.08]",
    dropZoneBorder: "border-purple-500/40",
  },
  done: {
    id: "done",
    label: "Done",
    shortLabel: "DONE",
    color: "#10b981",
    dotColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    borderClass: "border-emerald-500/25 hover:border-emerald-500/55",
    activeBorderClass: "border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    cardGlow: "rgba(16,185,129,0.12)",
    cardBg: "bg-gradient-to-b from-[#08171d] to-[#090d1f]",
    badgeStyle: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    indicatorIcon: CheckCircle2,
    dropZoneBg: "bg-emerald-500/[0.08]",
    dropZoneBorder: "border-emerald-500/40",
    isDone: true,
  },
  blocked: {
    id: "blocked",
    label: "Blocked",
    shortLabel: "BLOCKED",
    color: "#f43f5e",
    dotColor: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
    borderClass: "border-rose-500/25 hover:border-rose-500/55",
    activeBorderClass: "border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.25)]",
    cardGlow: "rgba(244,63,94,0.12)",
    cardBg: "bg-gradient-to-b from-[#190b14] to-[#090d1f]",
    badgeStyle: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    indicatorIcon: AlertCircle,
    dropZoneBg: "bg-rose-500/[0.08]",
    dropZoneBorder: "border-rose-500/40",
  },
};

export function getStatusConfig(status?: string): StatusConfigItem {
  if (!status) return STATUS_CONFIG.todo;
  const key = status === "in_review" ? "review" : status.toLowerCase();
  return STATUS_CONFIG[key] || STATUS_CONFIG.todo;
}
