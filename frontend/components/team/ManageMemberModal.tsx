"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Crown,
  Shield,
  Eye,
  Trash2,
  Check,
  Loader2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { projectAPI } from "@/lib/api";
import { generateAvatar, cn, formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import toast from "react-hot-toast";

interface ManageMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  member: any; // { user: { _id, name, email, avatar }, role, permissions, joinedAt }
  isOwner: boolean;
  currentUserId?: string;
  onMemberUpdated: () => void;
  onMemberRemoved: () => void;
}

const ALL_PERMISSIONS = [
  { id: "view", label: "View Project", desc: "Access boards, backlogs, wiki, and analytics" },
  { id: "create", label: "Create Tasks", desc: "Create new backlog items and sprints" },
  { id: "edit", label: "Edit Tasks", desc: "Update task details, drag-and-drop statuses" },
  { id: "delete", label: "Delete Tasks", desc: "Delete tasks and documents" },
  { id: "manage", label: "Manage Project", desc: "Manage members, settings, and join codes" },
];

export function ManageMemberModal({
  isOpen,
  onClose,
  projectId,
  member,
  isOwner,
  currentUserId,
  onMemberUpdated,
  onMemberRemoved,
}: ManageMemberModalProps) {
  const user = member?.user;
  const isTargetOwner = member?.role === "admin" && isOwner && member?.user?._id === currentUserId;

  const [role, setRole] = useState(member?.role || "member");
  const [permissions, setPermissions] = useState<string[]>(member?.permissions || ["view", "create", "edit"]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (member) {
      setRole(member.role || "member");
      setPermissions(member.permissions || ["view", "create", "edit"]);
      setShowDeleteConfirm(false);
    }
  }, [member]);

  if (!isOpen || !member || !user) return null;

  const togglePermission = (permId: string) => {
    setPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await projectAPI.updateMemberRole(projectId, user._id, {
        role,
        permissions,
      });
      toast.success(`Updated access for ${user.name}`);
      onMemberUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update member role");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await projectAPI.removeMember(projectId, user._id);
      toast.success(`${user.name} removed from project`);
      onMemberRemoved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove member");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md">
        {/* Backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#090d1f] border border-white/[0.12] rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar
                src={user.avatar}
                name={user.name}
                size="md"
                ringClassName="border-2 border-white/[0.1]"
              />
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white tracking-tight truncate">
                  Manage {user.name}
                </h2>
                <p className="text-xs font-mono text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Role Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Project Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "admin", label: "Admin", icon: Crown, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                  { id: "member", label: "Member", icon: Shield, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
                  { id: "viewer", label: "Viewer", icon: Eye, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
                ].map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={cn(
                        "p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5",
                        isSelected
                          ? "bg-violet-600/15 border-violet-500/50 shadow-[0_0_15px_rgba(124,92,255,0.2)] text-white"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] text-slate-400"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Granular Permissions */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Granular Permissions
              </label>
              <div className="space-y-2 bg-[#060914] p-3 rounded-2xl border border-white/[0.06]">
                {ALL_PERMISSIONS.map((p) => {
                  const isGranted = permissions.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePermission(p.id)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-200">{p.label}</p>
                        <p className="text-[10px] text-slate-500">{p.desc}</p>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-lg flex items-center justify-center border transition-all flex-shrink-0",
                          isGranted
                            ? "bg-violet-600 border-violet-400 text-white"
                            : "border-white/[0.15] bg-white/[0.02]"
                        )}
                      >
                        {isGranted && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-white/[0.06]">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove from Project</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Are you sure you want to remove <strong>{user.name}</strong> from this project? They will lose access to all tasks and discussions immediately.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-1.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={isRemoving}
                      className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Removal"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

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
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(124,92,255,0.4)] hover:shadow-[0_0_28px_rgba(124,92,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
