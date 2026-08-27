"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  Briefcase,
  Globe,
  MapPin,
  Clock,
  Languages,
  Check,
  Shield,
  Camera,
  FolderKanban,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { generateAvatar, cn } from "@/lib/utils";
import { AvatarUploadModal } from "./AvatarUploadModal";
import Link from "next/link";

interface ProfileTabProps {
  formData: {
    name: string;
    bio: string;
    title: string;
    location: string;
    website: string;
    timezone: string;
    language: string;
  };
  onChange: (field: string, value: string) => void;
}

export function ProfileTab({ formData, onChange }: ProfileTabProps) {
  const { user } = useAuthStore();
  const { projects } = useProjectStore();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const avatar = user?.avatar || generateAvatar(user?.name || "User");

  // Profile strength calculation
  const completedFields = [
    Boolean(user?.avatar),
    Boolean(formData.name),
    Boolean(formData.title),
    Boolean(formData.bio),
    Boolean(formData.location),
  ].filter(Boolean).length;
  const strengthPercentage = Math.round((completedFields / 5) * 100);

  return (
    <div className="space-y-6">
      {/* ── 1. Profile Overview Header Card ── */}
      <div className="p-6 rounded-3xl bg-[#090d22] border border-white/[0.08] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar with Change Button */}
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-2 ring-violet-500/40 bg-[#060914] shadow-md flex-shrink-0">
                <img
                  src={avatar}
                  alt={user?.name || ""}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
                title="Change Photo"
                aria-label="Change profile photo"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Edit</span>
              </button>
            </div>

            {/* Profile Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-white">{user?.name || "Developer"}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-violet-500/15 border border-violet-500/25 text-violet-300 capitalize">
                  <Shield className="w-3 h-3" />
                  {user?.role || "Member"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>

              <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user?.email}</span>
                <span className="text-emerald-400 font-bold ml-1">Verified ✓</span>
              </p>

              <p className="text-xs text-slate-400 font-medium">
                {formData.title || "Software Engineer"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Change Photo
          </button>
        </div>

        {/* Profile Strength Bar */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Profile Strength</span>
              <span className="text-violet-400 font-bold font-mono">
                {strengthPercentage}%
              </span>
            </p>
            <div className="w-48 sm:w-64 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${strengthPercentage}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-mono hidden sm:block">
            {completedFields} of 5 fields complete
          </p>
        </div>
      </div>

      {/* ── 2. Personal Information Form ── */}
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
            Personal Information
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Your personal details are visible to collaborators in your workspaces.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Full Name <span className="text-violet-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Your full name"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500/50 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors"
                required
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-500">
              Used across mentions, task assignments, and activity feeds.
            </p>
          </div>

          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Job Title / Role
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => onChange("title", e.target.value)}
                placeholder="e.g. Senior Fullstack Engineer"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500/50 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors"
              />
              <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-500">
              Your primary engineering or design specialization.
            </p>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.location}
                onChange={(e) => onChange("location", e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500/50 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors"
              />
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Website / Portfolio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Website or Portfolio
            </label>
            <div className="relative">
              <input
                type="url"
                value={formData.website}
                onChange={(e) => onChange("website", e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500/50 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors"
              />
              <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Timezone
            </label>
            <div className="relative">
              <select
                value={formData.timezone}
                onChange={(e) => onChange("timezone", e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500/50 text-white text-xs focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">Eastern Time (US & Canada) - UTC-5</option>
                <option value="America/Chicago">Central Time (US & Canada) - UTC-6</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada) - UTC-8</option>
                <option value="Europe/London">London, GMT - UTC+0</option>
                <option value="Europe/Paris">Central European Time - UTC+1</option>
                <option value="Asia/Kolkata">India Standard Time - UTC+5:30</option>
                <option value="Asia/Tokyo">Japan Standard Time - UTC+9</option>
                <option value="Australia/Sydney">Australian Eastern Time - UTC+10</option>
              </select>
              <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Interface Language
            </label>
            <div className="relative">
              <select
                value={formData.language}
                onChange={(e) => onChange("language", e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500/50 text-white text-xs focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="English (US)">English (US)</option>
                <option value="English (UK)">English (UK)</option>
                <option value="Spanish">Español (Spanish)</option>
                <option value="German">Deutsch (German)</option>
                <option value="Japanese">日本語 (Japanese)</option>
                <option value="French">Français (French)</option>
              </select>
              <Languages className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Bio */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Biography
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => onChange("bio", e.target.value)}
              rows={3}
              placeholder="Tell your engineering team a little about yourself, your tech stack, or your work philosophy..."
              className="w-full p-3 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500/50 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors resize-y"
            />
            <p className="text-[11px] text-slate-500">
              Markdown formatting is supported. Maximum 500 characters.
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Workspace Memberships Section ── */}
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
              Your Workspace Memberships
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Workspaces you have access to across your SprintForge organization.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {projects.length} Total
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {projects.map((project) => (
            <div
              key={project._id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-mono font-bold flex-shrink-0"
                  style={{ backgroundColor: project.color || "#6366f1" }}
                >
                  {project.key?.charAt(0) || "P"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{project.name}</p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {project.key} · {project.type} · {project.members?.length || 1} members
                  </p>
                </div>
              </div>

              <Link
                href={`/dashboard/projects/${project._id}/board`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Open workspace"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="sm:col-span-2 py-8 text-center text-xs text-slate-500">
              No workspace memberships found.
            </div>
          )}
        </div>
      </div>

      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />
    </div>
  );
}
