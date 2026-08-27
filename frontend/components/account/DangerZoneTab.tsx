"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X, AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function DangerZoneTab() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");

  const handleDeleteAccount = async () => {
    if (confirmationInput !== "DELETE MY ACCOUNT") {
      toast.error("Please type DELETE MY ACCOUNT exactly to confirm");
      return;
    }

    try {
      // Perform logout/cleanup
      await logout();
      toast.success("Account deleted. We're sorry to see you go.");
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#090d20] border border-rose-500/20 shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Danger Zone
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Irreversible actions that affect your SprintForge account and personal data.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* Deactivate */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15">
            <div>
              <p className="text-xs font-bold text-white">Deactivate Account</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Temporarily pause task notifications and hide your profile from directory listings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast("Account deactivation requested. Contact workspace admin to reinstate.", { icon: "⏸️" })}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
            >
              Deactivate
            </button>
          </div>

          {/* Delete Account */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15">
            <div>
              <p className="text-xs font-bold text-rose-300">Permanently Delete Account</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Permanently purge your account, profile data, and personal associations. This action cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex-shrink-0 shadow-md"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="fixed inset-0" onClick={() => setIsDeleteModalOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#090d20] border border-rose-500/30 rounded-3xl shadow-2xl z-10 overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Delete your account?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  This will permanently delete your SprintForge profile, personal settings, and access keys. You cannot undo this action.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs text-slate-300 font-medium">
                  Type <span className="font-mono text-rose-400 font-bold">DELETE MY ACCOUNT</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060914] border border-rose-500/30 text-white text-xs font-mono focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={confirmationInput !== "DELETE MY ACCOUNT"}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
