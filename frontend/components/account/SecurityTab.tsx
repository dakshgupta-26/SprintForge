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
  CheckCircle2,
  Mail,
  Shield,
  Laptop,
  History,
  Download,
  Info,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export function SecurityTab() {
  const { user, setPassword: storeSetPassword, updateUser } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const isGoogleConnected = Boolean(
    user?.provider === "google" || user?.providerId
  );
  const hasPasswordConfigured = Boolean(
    user?.hasPassword ?? (user?.provider === "local" || !user?.providerId)
  );
  const isEmailVerified = user?.emailVerified !== false;

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

    if (hasPasswordConfigured && !currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (!/\d/.test(newPassword)) {
      toast.error("New password must contain at least one number");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsSaving(true);
    try {
      if (hasPasswordConfigured) {
        await authAPI.changePassword({
          currentPassword,
          newPassword,
        });
        toast.success("Password updated successfully! 🔒");
      } else {
        await storeSetPassword(newPassword);
        toast.success("Password created! Email + Password login enabled. 🎉");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportSecurityData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      user: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        emailVerified: user?.emailVerified,
        authenticationMethods: {
          google: isGoogleConnected ? "Connected" : "Not Connected",
          emailPassword: hasPasswordConfigured ? "Enabled" : "Not Configured",
        },
        role: user?.role,
        createdAt: user?.createdAt,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sprintforge-security-audit-${user?._id || "user"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Security report downloaded");
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Authentication Methods Overview ── */}
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              Authentication Methods
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configured identity providers, credentials, and verification status for this account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportSecurityData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Security Summary</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Google */}
          <div className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] flex flex-col justify-between gap-3 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Google</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                    Single Sign-On
                  </p>
                </div>
              </div>

              {isGoogleConnected ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </span>
              ) : (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Not Connected
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-white/[0.04] text-[11px] text-slate-400 flex items-center justify-between">
              <span className="truncate">
                {isGoogleConnected ? user?.email : "OAuth 2.0 SSO"}
              </span>
              {isGoogleConnected ? (
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  Active
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">
                  Available
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Email + Password */}
          <div className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] flex flex-col justify-between gap-3 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0 text-violet-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Email + Password</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                    Standard Auth
                  </p>
                </div>
              </div>

              {hasPasswordConfigured ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  Enabled
                </span>
              ) : (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Not Configured
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-white/[0.04] text-[11px] text-slate-400 flex items-center justify-between">
              <span className="truncate">
                {hasPasswordConfigured ? "Password Protected" : "Set password below"}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {hasPasswordConfigured ? "Encrypted" : "Optional"}
              </span>
            </div>
          </div>

          {/* Card 3: Email Verification Status */}
          <div className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] flex flex-col justify-between gap-3 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Email Status</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                    Verification
                  </p>
                </div>
              </div>

              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                  <Check className="w-3 h-3" />
                  Verified ✓
                </span>
              ) : (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  Unverified
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-white/[0.04] text-[11px] text-slate-400 flex items-center justify-between">
              <span className="truncate">{user?.email}</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {isEmailVerified ? "Confirmed" : "Pending"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Password Configuration / Change ── */}
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-violet-400" />
            {hasPasswordConfigured ? "Change Password" : "Set Account Password"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {hasPasswordConfigured
              ? "Use a unique password with at least 8 characters and a number to keep your account secure."
              : "You originally signed in with Google. Set an account password to enable email & password sign-in as well."}
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          {/* Current Password (Only if user has configured password) */}
          {hasPasswordConfigured && (
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
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {hasPasswordConfigured ? "New Password" : "Create Master Password"}
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter password (min. 8 chars, 1 number)"
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
                {showNew ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
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
                        step <= strength.score
                          ? strength.color
                          : "bg-white/[0.06]"
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
              Confirm Password
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
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
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
              disabled={
                isSaving ||
                (hasPasswordConfigured && !currentPassword) ||
                !newPassword ||
                newPassword !== confirmPassword
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>
                {hasPasswordConfigured ? "Update Password" : "Set Password & Enable Email Login"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* ── 3. Two-Factor Authentication (2FA) ── */}
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/15 border border-violet-500/30 text-violet-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Two-Factor Authentication (2FA)
                </h3>
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
            onClick={() =>
              toast("2FA Authenticator setup is coming in the next enterprise update!", {
                icon: "🔐",
              })
            }
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-bold text-white transition-colors cursor-pointer flex-shrink-0"
          >
            Configure 2FA
          </button>
        </div>
      </div>
    </div>
  );
}

