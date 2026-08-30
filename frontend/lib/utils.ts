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

export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarGradient(name?: string | null): string {
  const gradients = [
    "from-violet-600 to-indigo-600",
    "from-indigo-600 to-blue-600",
    "from-blue-600 to-cyan-600",
    "from-emerald-600 to-teal-600",
    "from-amber-600 to-orange-600",
    "from-rose-600 to-pink-600",
    "from-purple-600 to-pink-600",
    "from-fuchsia-600 to-purple-600",
  ];
  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export function generateAvatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=6366f1&color=fff&size=80&bold=true`;
}

export function getAvatarUrl(avatar?: string | null, name: string = "User"): string {
  if (!avatar || avatar.trim() === "") {
    return "";
  }
  if (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("data:") ||
    avatar.startsWith("blob:")
  ) {
    return avatar;
  }
  const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
  return `${backendBase}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
}

export function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + "..." : str;
}
