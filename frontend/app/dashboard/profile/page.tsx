"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { authAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Sliders,
  Bell,
  Lock,
  Laptop,
  Link2,
  History,
  AlertTriangle,
  ShieldCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Modular Account Center Tabs
import { ProfileTab } from "@/components/account/ProfileTab";
import { PreferencesTab } from "@/components/account/PreferencesTab";
import { NotificationsTab } from "@/components/account/NotificationsTab";
import { SecurityTab } from "@/components/account/SecurityTab";
import { SessionsTab } from "@/components/account/SessionsTab";
import { ConnectedAppsTab } from "@/components/account/ConnectedAppsTab";
import { AccountActivityTab } from "@/components/account/AccountActivityTab";
import { DangerZoneTab } from "@/components/account/DangerZoneTab";
import { StickySaveBar } from "@/components/account/StickySaveBar";

type AccountSection =
  | "profile"
  | "preferences"
  | "notifications"
  | "security"
  | "sessions"
  | "connections"
  | "activity"
  | "danger";

interface TabItem {
  id: AccountSection;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string;
  isDanger?: boolean;
}

const navTabs: TabItem[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security & Password", icon: Lock },
  { id: "sessions", label: "Active Sessions", icon: Laptop },
  { id: "connections", label: "Connected Apps", icon: Link2 },
  { id: "activity", label: "Account Activity", icon: History },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle, isDanger: true },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AccountSection>("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Form data for profile editable fields
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    title: "",
    location: "",
    website: "",
    timezone: "UTC",
    language: "English (US)",
  });

  // Populate form with user data on load
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        title: user.title || "",
        location: (user as any).location || "",
        website: (user as any).website || "",
        timezone: (user as any).timezone || "UTC",
        language: (user as any).language || "English (US)",
      });
    }
  }, [user]);

  // Track if profile form has unsaved modifications
  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      formData.name !== (user.name || "") ||
      formData.bio !== (user.bio || "") ||
      formData.title !== (user.title || "") ||
      formData.location !== ((user as any).location || "") ||
      formData.website !== ((user as any).website || "") ||
      formData.timezone !== ((user as any).timezone || "UTC") ||
      formData.language !== ((user as any).language || "English (US)")
    );
  }, [formData, user]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        title: user.title || "",
        location: (user as any).location || "",
        website: (user as any).website || "",
        timezone: (user as any).timezone || "UTC",
        language: (user as any).language || "English (US)",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error("Full name is required");
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await authAPI.updateProfile(formData);
      updateUser(data);
      toast.success("Profile changes saved! ✨");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-[1500px] mx-auto space-y-6 pb-16 select-none">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Account Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal profile, preferences, security, workspace sessions, and connected tools.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Account in good standing
          </span>
        </div>
      </div>

      {/* ── Account Center 2-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Navigation Sidebar / Horizontal Tabs on Mobile ── */}
        <div className="lg:col-span-3 lg:sticky lg:top-20 space-y-1">
          {/* Mobile Horizontal Scroll Tabs */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0",
                    isActive
                      ? tab.isDanger
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-violet-600/20 text-violet-300 border border-violet-500/40"
                      : "bg-[#090d20] text-slate-400 hover:text-white border border-white/[0.06]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Left Navigation Card */}
          <div className="hidden lg:block p-2 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-0.5">
            <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Account Settings
            </div>

            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left relative",
                    isActive
                      ? tab.isDanger
                        ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm"
                        : "bg-violet-600/15 text-violet-200 border border-violet-500/30 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive
                          ? tab.isDanger
                            ? "text-rose-400"
                            : "text-violet-400"
                          : "text-slate-500"
                      )}
                    />
                    <span className="truncate">{tab.label}</span>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="active-account-tab-indicator"
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        tab.isDanger ? "bg-rose-400" : "bg-violet-400"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right Content Area ── */}
        <div className="lg:col-span-9 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {activeTab === "profile" && (
                <ProfileTab formData={formData} onChange={handleFieldChange} />
              )}
              {activeTab === "preferences" && <PreferencesTab />}
              {activeTab === "notifications" && <NotificationsTab />}
              {activeTab === "security" && <SecurityTab />}
              {activeTab === "sessions" && <SessionsTab />}
              {activeTab === "connections" && <ConnectedAppsTab />}
              {activeTab === "activity" && <AccountActivityTab />}
              {activeTab === "danger" && <DangerZoneTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Sticky Unsaved Changes Bar ── */}
      <StickySaveBar
        hasChanges={hasChanges && activeTab === "profile"}
        isSaving={isSaving}
        onSave={handleSaveProfile}
        onReset={handleReset}
      />
    </div>
  );
}
