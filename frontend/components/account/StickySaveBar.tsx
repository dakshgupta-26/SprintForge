"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check, Loader2, RotateCcw } from "lucide-react";

interface StickySaveBarProps {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function StickySaveBar({
  hasChanges,
  isSaving,
  onSave,
  onReset,
}: StickySaveBarProps) {
  return (
    <AnimatePresence>
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4"
        >
          <div className="flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#090d22] border border-violet-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(124,92,255,0.25)] backdrop-blur-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-white truncate">
                Careful — you have unsaved changes!
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onReset}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.1] hover:bg-white/[0.04] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-60 transition-all active:scale-95"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
