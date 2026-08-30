"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, ArrowUpRight, Clock } from "lucide-react";
import { useChatUnreadStore, ChatToastItem } from "@/lib/store/chatUnreadStore";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";

const TOAST_DURATION_MS = 5500;

function SingleChatToastCard({
  toast,
  onDismiss,
}: {
  toast: ChatToastItem;
  onDismiss: (id: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(TOAST_DURATION_MS);
  const animationFrameRef = useRef<number | null>(null);

  // Auto-dismiss countdown with hover pause
  useEffect(() => {
    if (isHovered) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    startTimeRef.current = Date.now();
    const duration = remainingTimeRef.current;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const left = Math.max(0, duration - elapsed);
      remainingTimeRef.current = left;
      const pct = (left / TOAST_DURATION_MS) * 100;
      setProgress(pct);

      if (left <= 0) {
        onDismiss(toast.id);
      } else {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered, toast.id, onDismiss]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(toast.id);
    const targetUrl = `/dashboard/projects/${toast.projectId}/chat`;
    if (pathname !== targetUrl) {
      router.push(targetUrl);
    }
  };

  return (
    <motion.div
      layout
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={cn(
        "group relative w-full max-w-[340px] sm:max-w-[360px] p-3.5 rounded-2xl cursor-pointer overflow-hidden select-none",
        "bg-[#0a0f24]/95 dark:bg-[#070b1a]/95 backdrop-blur-xl border border-violet-500/25",
        "shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_15px_rgba(124,92,255,0.15)]",
        "hover:border-violet-500/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.55),0_0_22px_rgba(124,92,255,0.25)]",
        "transition-all duration-200"
      )}
    >
      {/* Top ambient highlight gradient */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

      <div className="flex items-start gap-3">
        {/* Sender Avatar with project badge */}
        <div className="relative flex-shrink-0">
          <UserAvatar
            name={toast.sender?.name || "Team Member"}
            src={toast.sender?.avatar}
            size="md"
            className="ring-2 ring-violet-500/30"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-violet-600 border border-[#0a0f24] flex items-center justify-center text-white shadow-sm">
            <MessageSquare className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center justify-between gap-1.5 mb-0.5">
            <h4 className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">
              {toast.sender?.name || "Team Member"}
            </h4>
            <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Just now
            </span>
          </div>

          <p className="text-[11px] text-slate-300 font-medium">
            {toast.messageCount > 1 ? (
              <span className="text-violet-300 font-semibold">
                Sent {toast.messageCount} new messages
              </span>
            ) : (
              <span>sent you a message</span>
            )}
          </p>

          <div className="mt-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-slate-300 font-semibold max-w-[170px] truncate">
              {toast.projectKey ? `${toast.projectKey} • ` : ""}
              {toast.projectName}
            </span>
            <span className="text-[10px] font-medium text-violet-400 group-hover:underline flex items-center gap-0.5 ml-auto">
              View <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(toast.id);
          }}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtle bottom progress bar */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.05]">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

export function GlobalChatToastContainer() {
  const { toasts, dismissToast } = useChatUnreadStore();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed top-16 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none"
      style={{ maxWidth: "calc(100vw - 32px)" }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <SingleChatToastCard toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
