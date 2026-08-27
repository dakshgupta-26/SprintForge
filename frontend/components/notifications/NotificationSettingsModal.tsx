"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bell,
  Mail,
  Zap,
  AtSign,
  Users,
  Volume2,
  Check,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({
  isOpen,
  onClose,
}: NotificationSettingsModalProps) {
  const [taskAlerts, setTaskAlerts] = useState(true);
  const [mentionAlerts, setMentionAlerts] = useState(true);
  const [inviteAlerts, setInviteAlerts] = useState(true);
  const [sprintAlerts, setSprintAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState<"instant" | "daily" | "weekly">("instant");

  if (!isOpen) return null;

  const handleSave = () => {
    toast.success("Notification preferences saved! ✨");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#090d1f] border border-white/[0.12] rounded-3xl shadow-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Notification Preferences
                </h3>
                <p className="text-xs text-slate-400">
                  Control how and when you receive workspace alerts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Settings List */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Delivery Frequency */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Email Digest Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["instant", "daily", "weekly"] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setDigestFrequency(freq)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                      digestFrequency === freq
                        ? "bg-violet-600 border-violet-400 text-white shadow-sm"
                        : "bg-[#060914] border-white/[0.06] text-slate-400 hover:bg-white/[0.03]"
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {/* In-App Channels */}
            <div className="space-y-3 pt-2 border-t border-white/[0.06]">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Real-Time Event Channels
              </p>

              {/* Task Assignments */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Task Assignments & Updates</p>
                    <p className="text-[11px] text-slate-400">When someone assigns or moves your work items</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={taskAlerts}
                  onChange={(e) => setTaskAlerts(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Mentions & Comments */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                    <AtSign className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Mentions & Comments</p>
                    <p className="text-[11px] text-slate-400">When teammates @mention you or reply to comments</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mentionAlerts}
                  onChange={(e) => setMentionAlerts(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Project Invitations */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Project Invitations</p>
                    <p className="text-[11px] text-slate-400">When you are invited to join an engineering workspace</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={inviteAlerts}
                  onChange={(e) => setInviteAlerts(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Sprint Milestones */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Sprint Milestones & Deadlines</p>
                    <p className="text-[11px] text-slate-400">Sprint cycle starts, completions, and velocity updates</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={sprintAlerts}
                  onChange={(e) => setSprintAlerts(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Audio Chime */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Subtle Notification Chime</p>
                    <p className="text-[11px] text-slate-400">Play a quiet audio tone on urgent alerts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0b1026] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
