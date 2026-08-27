"use client";

import React, { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Check,
  Loader2,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export function SecurityTab() {
  const { user } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(newPassword);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Password updated successfully! 🔒");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Change Password ── */}
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
            Change Password
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Use a unique password with at least 8 characters to keep your account secure.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500/50 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors"
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="p-1 text-slate-500 hover:text-white absolute right-3 top-2.5"
                title={showCurrent ? "Hide password" : "Show password"}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 chars)"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500/50 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors"
                required
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="p-1 text-slate-500 hover:text-white absolute right-3 top-2.5"
                title={showNew ? "Hide password" : "Show password"}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {newPassword && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Strength</span>
                  <span
                    className={cn(
                      "font-bold",
                      strength.score === 1 && "text-rose-400",
                      strength.score === 2 && "text-amber-400",
                      strength.score === 3 && "text-blue-400",
                      strength.score === 4 && "text-emerald-400"
                    )}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={cn(
                        "h-full rounded-full transition-colors",
                        step <= strength.score ? strength.color : "bg-white/[0.06]"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#060914] border border-white/[0.08] focus:border-violet-500/50 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors"
                required
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="p-1 text-slate-500 hover:text-white absolute right-3 top-2.5"
                title={showConfirm ? "Hide password" : "Show password"}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-rose-400 font-mono">
                Passwords do not match.
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── 2. Two-Factor Authentication (2FA) ── */}
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/15 border border-violet-500/30 text-violet-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Optional
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Add an additional layer of security to your SprintForge account with an Authenticator app (Google Authenticator, Authy, or 1Password).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toast("2FA Authenticator setup is coming in the next enterprise update!", { icon: "🔐" })}
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-bold text-white transition-colors cursor-pointer flex-shrink-0"
          >
            Configure 2FA
          </button>
        </div>
      </div>
    </div>
  );
}
