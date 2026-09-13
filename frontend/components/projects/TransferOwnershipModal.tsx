"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { useProjectStore, ProjectMember } from "@/lib/store/projectStore";
import toast from "react-hot-toast";

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  members: ProjectMember[];
  currentOwnerId: string;
  onTransferred?: () => void;
}

export function TransferOwnershipModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  members = [],
  currentOwnerId,
  onTransferred,
}: TransferOwnershipModalProps) {
  const { transferOwnership } = useProjectStore();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [typedName, setTypedName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter out the current owner
  const eligibleMembers = members.filter(
    (m) => String(m.user?._id) !== String(currentOwnerId)
  );

  const isMatch = typedName.trim() === projectName.trim();
  const isValid = Boolean(selectedMemberId) && isMatch;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await transferOwnership(projectId, selectedMemberId, projectName);
      toast.success("Project ownership successfully transferred! 👑");
      onTransferred?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to transfer ownership");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={!isSubmitting ? onClose : undefined}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-md bg-[#0a0d1e] border border-amber-500/30 rounded-3xl shadow-2xl z-10 overflow-hidden"
        >
          {/* Accent top line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-yellow-400" />

          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0c1024] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Crown className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Transfer Ownership</h3>
            </div>
            {!isSubmitting && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleTransfer} className="p-6 space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Transferring ownership gives full control of this project to another member. You will
                automatically be transitioned to an <strong>Admin</strong>.
              </p>
            </div>

            {eligibleMembers.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-[#060914] border border-white/[0.06] space-y-2">
                <p className="text-xs text-slate-400">
                  There are no other members in this project. Invite a team member first before transferring ownership.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Select New Project Owner
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.1] text-xs font-medium text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    <option value="">Choose a member...</option>
                    {eligibleMembers.map((m) => (
                      <option key={m.user?._id} value={m.user?._id}>
                        {m.user?.name} ({m.user?.email}) · {m.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Type <span className="text-white font-mono font-bold">{projectName}</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder={projectName}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.1] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs font-mono text-white placeholder:text-slate-600 outline-none"
                  />
                </div>
              </>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(217,119,6,0.35)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Transferring...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5" />
                    <span>Confirm Transfer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
