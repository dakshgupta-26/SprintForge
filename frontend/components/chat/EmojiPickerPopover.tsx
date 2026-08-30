"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Theme, EmojiStyle, SuggestionMode } from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// Dynamic import to prevent SSR hydration mismatch with emoji picker
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="w-[340px] h-[400px] flex items-center justify-center bg-[#090d20] rounded-2xl text-slate-500 text-xs font-mono">
      Loading emoji catalog...
    </div>
  ),
});

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPickerPopover({
  isOpen,
  onClose,
  onEmojiSelect,
  className,
}: EmojiPickerPopoverProps) {
  const { resolvedTheme } = useTheme();
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDark = resolvedTheme === "dark" || resolvedTheme === undefined;

  return (
    <AnimatePresence>
      <motion.div
        ref={pickerRef}
        initial={{ opacity: 0, scale: 0.98, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 4 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "absolute bottom-full left-0 mb-3 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/[0.12] bg-[#090d20]",
          className
        )}
      >
        <EmojiPicker
          theme={isDark ? Theme.DARK : Theme.LIGHT}
          emojiStyle={EmojiStyle.NATIVE}
          lazyLoadEmojis={true}
          autoFocusSearch={false}
          suggestedEmojisMode={SuggestionMode.RECENT}
          searchPlaceHolder="Search emojis (e.g. laugh, fire, heart)..."
          previewConfig={{
            showPreview: true,
          }}
          skinTonesDisabled={false}
          width={340}
          height={410}
          onEmojiClick={(emojiData) => {
            onEmojiSelect(emojiData.emoji);
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
