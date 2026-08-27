"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UserPlus,
  Mail,
  Crown,
  Shield,
  Eye,
  Search,
  Loader2,
  Check,
  Sparkles,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { projectAPI, teamsAPI } from "@/lib/api";
import { generateAvatar, cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  projectColor?: string;
  existingMemberIds?: string[];
  onInviteSent: () => void;
}

const ROLES = [
  {
    id: "member",
    name: "Member",
    icon: Shield,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    desc: "Can view, create, and edit tasks, join sprints, and participate in project chat.",
  },
  {
    id: "admin",
    name: "Admin",
    icon: Crown,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    desc: "Full access to project settings, member management, join codes, and integrations.",
  },
  {
    id: "viewer",
    name: "Viewer",
    icon: Eye,
    color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
    desc: "Read-only access to boards, sprints, and wiki documents.",
  },
];

export function InviteMemberModal({
  isOpen,
  onClose,
  projectId,
  projectName = "TASKDEV",
  projectColor = "#6366f1",
  existingMemberIds = [],
  onInviteSent,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);

  // User search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setRole("member");
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  // Debounced search for existing SprintForge users
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await teamsAPI.search(searchQuery.trim());
        setSearchResults(data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsInviting(true);
    try {
      await projectAPI.invite(projectId, { email: email.trim(), role });
      toast.success(`Invitation sent to ${email}! 🚀`);
      setEmail("");
      onInviteSent();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setEmail(user.email);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (!isOpen) return null;

  const filteredSearchResults = searchResults.filter(
    (u) => !existingMemberIds.includes(u._id)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md">
        {/* Backdrop dismiss */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-xl bg-[#090d1f] border border-white/[0.12] rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-4 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: projectColor }}
                >
                  {projectName.charAt(0)}
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {projectName}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                  Team Access
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Invite people to {projectName}
              </h2>
              <p className="text-xs text-slate-400">
                Bring your engineering teammates into the project workspace.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSendInvite} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-600 font-sans"
                />
              </div>
            </div>

            {/* Quick Search Existing Users */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Or search existing teammates
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-600 font-sans"
                />
              </div>

              {/* Search Dropdown Results */}
              {(searchQuery.trim().length >= 2 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#090d1f] border border-white/[0.12] rounded-2xl shadow-2xl z-20 overflow-hidden max-h-56 overflow-y-auto divide-y divide-white/[0.04]">
                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2 p-4 text-xs text-slate-400 font-mono">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      <span>Searching directory...</span>
                    </div>
                  ) : filteredSearchResults.length > 0 ? (
                    filteredSearchResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.04] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={user.avatar || generateAvatar(user.name)}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-white/[0.1]"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-violet-300 truncate">
                              {user.name}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-violet-400 group-hover:underline flex items-center gap-1">
                          Select <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 font-mono">
                      No matching registered users found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Project Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={cn(
                        "p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-1",
                        isSelected
                          ? "bg-violet-600/15 border-violet-500/50 shadow-[0_0_15px_rgba(124,92,255,0.2)]"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full border",
                            r.color
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          {r.name}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-white">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {r.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendInvite}
              disabled={isInviting || !email.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(124,92,255,0.4)] hover:shadow-[0_0_28px_rgba(124,92,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              {isInviting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Invitation...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
