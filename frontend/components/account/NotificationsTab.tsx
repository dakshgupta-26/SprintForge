"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Check,
  CheckSquare,
  MessageSquare,
  Zap,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useChatUnreadStore } from "@/lib/store/chatUnreadStore";
import { cn } from "@/lib/utils";

interface NotificationChannelSettings {
  inApp: boolean;
  email: boolean;
}

export function NotificationsTab() {
  const [preferences, setPreferences] = useState({
    taskAssigned: { inApp: true, email: true },
    taskUpdated: { inApp: true, email: false },
    mentions: { inApp: true, email: true },
    sprintEvents: { inApp: true, email: false },
    teamInvites: { inApp: true, email: true },
  });
  const [lastSaved, setLastSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sf_notif_prefs");
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const togglePref = (key: keyof typeof preferences, channel: "inApp" | "email") => {
    setPreferences((prev) => {
      const next = {
        ...prev,
        [key]: {
          ...prev[key],
          [channel]: !prev[key][channel],
        },
      };
      localStorage.setItem("sf_notif_prefs", JSON.stringify(next));
      triggerSavedNotice();
      return next;
    });
  };

  const triggerSavedNotice = () => {
    setLastSaved(true);
    setTimeout(() => setLastSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
              Notification Routing
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select which channels deliver updates for key workspace events.
            </p>
          </div>
          {lastSaved && (
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Preferences Saved
            </span>
          )}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 pb-2 border-b border-white/[0.06] text-[11px] font-mono uppercase font-bold text-slate-500">
          <div className="col-span-8 sm:col-span-8">Event Trigger</div>
          <div className="col-span-2 sm:col-span-2 text-center">In-App</div>
          <div className="col-span-2 sm:col-span-2 text-center">Email</div>
        </div>

        {/* Event Rows */}
        <div className="space-y-4">
          {/* 1. Task Assigned */}
          <div className="grid grid-cols-12 gap-4 items-center p-3 rounded-2xl bg-[#060914] border border-white/[0.04]">
            <div className="col-span-8 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center flex-shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Task Assignments</p>
                <p className="text-[11px] text-slate-400 truncate">
                  When a task or issue is assigned directly to you
                </p>
              </div>
            </div>
            <div className="col-span-2 flex justify-center">
              <ToggleSwitch
                checked={preferences.taskAssigned.inApp}
                onChange={() => togglePref("taskAssigned", "inApp")}
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <ToggleSwitch
                checked={preferences.taskAssigned.email}
                onChange={() => togglePref("taskAssigned", "email")}
              />
            </div>
          </div>

          {/* 2. Mentions & Chat */}
          <div className="grid grid-cols-12 gap-4 items-center p-3 rounded-2xl bg-[#060914] border border-white/[0.04]">
            <div className="col-span-8 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Mentions & Chat</p>
                <p className="text-[11px] text-slate-400 truncate">
                  When you are @mentioned in comments or team chat
                </p>
              </div>
            </div>
            <div className="col-span-2 flex justify-center">
              <ToggleSwitch
                checked={preferences.mentions.inApp}
                onChange={() => togglePref("mentions", "inApp")}
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <ToggleSwitch
                checked={preferences.mentions.email}
                onChange={() => togglePref("mentions", "email")}
              />
            </div>
          </div>

          {/* 3. Task Status Changes */}
          <div className="grid grid-cols-12 gap-4 items-center p-3 rounded-2xl bg-[#060914] border border-white/[0.04]">
            <div className="col-span-8 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Status Transitions</p>
                <p className="text-[11px] text-slate-400 truncate">
                  When tasks you created or watch move to Done or Blocked
                </p>
              </div>
            </div>
            <div className="col-span-2 flex justify-center">
              <ToggleSwitch
                checked={preferences.taskUpdated.inApp}
                onChange={() => togglePref("taskUpdated", "inApp")}
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <ToggleSwitch
                checked={preferences.taskUpdated.email}
                onChange={() => togglePref("taskUpdated", "email")}
              />
            </div>
          </div>

          {/* 4. Sprint Milestones */}
          <div className="grid grid-cols-12 gap-4 items-center p-3 rounded-2xl bg-[#060914] border border-white/[0.04]">
            <div className="col-span-8 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Sprint Milestones</p>
                <p className="text-[11px] text-slate-400 truncate">
                  When a sprint starts, completes, or burndown alerts occur
                </p>
              </div>
            </div>
            <div className="col-span-2 flex justify-center">
              <ToggleSwitch
                checked={preferences.sprintEvents.inApp}
                onChange={() => togglePref("sprintEvents", "inApp")}
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <ToggleSwitch
                checked={preferences.sprintEvents.email}
                onChange={() => togglePref("sprintEvents", "email")}
              />
            </div>
          </div>

          {/* 5. Team Invites */}
          <div className="grid grid-cols-12 gap-4 items-center p-3 rounded-2xl bg-[#060914] border border-white/[0.04]">
            <div className="col-span-8 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Team & Project Invitations</p>
                <p className="text-[11px] text-slate-400 truncate">
                  When you are added to a new project or workspace
                </p>
              </div>
            </div>
            <div className="col-span-2 flex justify-center">
              <ToggleSwitch
                checked={preferences.teamInvites.inApp}
                onChange={() => togglePref("teamInvites", "inApp")}
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <ToggleSwitch
                checked={preferences.teamInvites.email}
                onChange={() => togglePref("teamInvites", "email")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Chat & Direct Message Realtime Alerts ── */}
      <ChatPreferencesSection />
    </div>
  );
}

function ChatPreferencesSection() {
  const {
    preferences: chatPrefs,
    updatePreferences,
    requestBrowserNotificationPermission,
  } = useChatUnreadStore();
  const [browserPermission, setBrowserPermission] = useState<string>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const handleBrowserToggle = async () => {
    if (!chatPrefs.browser) {
      const res = await requestBrowserNotificationPermission();
      setBrowserPermission(res);
    } else {
      updatePreferences({ browser: false });
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          Realtime Chat & Messaging Notifications
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure how SprintForge notifies you when team members send messages across channels.
        </p>
      </div>

      <div className="space-y-3">
        {/* In-App Floating Toasts */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#060914] border border-white/[0.04]">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-bold text-white">In-App Floating Toasts</p>
            <p className="text-[11px] text-slate-400">
              Display temporary glass toast notifications in the top-right when working elsewhere in the app
            </p>
          </div>
          <ToggleSwitch
            checked={chatPrefs.inApp}
            onChange={() => updatePreferences({ inApp: !chatPrefs.inApp })}
          />
        </div>

        {/* Browser Desktop Notifications */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#060914] border border-white/[0.04]">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-white">Browser Desktop Notifications</p>
              {browserPermission === "denied" && (
                <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                  Permission Blocked in Browser
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Receive system push alerts when SprintForge is running in background or minimized tab
            </p>
          </div>
          <ToggleSwitch
            checked={chatPrefs.browser && browserPermission === "granted"}
            onChange={handleBrowserToggle}
          />
        </div>

        {/* Sound Notifications */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#060914] border border-white/[0.04]">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-bold text-white">Subtle Notification Chime</p>
            <p className="text-[11px] text-slate-400">
              Play a soft, gentle audio chime when a new message arrives
            </p>
          </div>
          <ToggleSwitch
            checked={chatPrefs.sound}
            onChange={() => updatePreferences({ sound: !chatPrefs.sound })}
          />
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-violet-500/40",
        checked ? "bg-violet-600" : "bg-white/[0.1]"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}
