import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, format: "short" | "long" | "relative" = "short") {
  const d = new Date(date);
  if (format === "relative") {
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  }
  if (format === "long") return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: "#3b82f6",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

export const PRIORITY_BG: Record<string, string> = {
  low: "priority-low",
  medium: "priority-medium",
  high: "priority-high",
  critical: "priority-critical",
};

export const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

/** Accent colors used for left border & glow per status */
export const STATUS_COLORS: Record<string, string> = {
  todo:        "#64748b",
  in_progress: "#6366f1",
  in_review:   "#f59e0b",
  done:        "#22c55e",
  blocked:     "#ef4444",
};

/** CSS class suffixes for task card status tints (see globals.css) */
export const STATUS_CARD_CLASS: Record<string, string> = {
  todo:        "card-todo",
  in_progress: "card-in-progress",
  in_review:   "card-in-review",
  done:        "card-done",
  blocked:     "card-blocked",
};

export const PROJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6",
];

export function generateAvatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=40&bold=true`;
}

export function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + "..." : str;
}
