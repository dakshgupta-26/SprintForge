"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Shield,
  Loader2,
  RefreshCw,
  Circle,
  XCircle,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { AuthErrorAlert, normalizeAuthError, AuthErrorInfo } from "./AuthErrorAlert";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

// ─── Live Password Requirements & Strength Evaluator ─────────────────────────
const passwordRequirements = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "uppercase", label: "One uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "One lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number (0-9)", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "One special character (!@#$%^&*)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function calculatePasswordStrength(password: string): {
  score: number;
  label: "Weak" | "Fair" | "Good" | "Strong";
  color: string;
  barColor: string;
  widthPercent: number;
} {
  if (!password) {
    return { score: 0, label: "Weak", color: "text-slate-500", barColor: "bg-slate-700", widthPercent: 0 };
  }

  let passedCount = 0;
  if (password.length >= 8) passedCount++;
  if (password.length >= 12) passedCount++;
  if (/[A-Z]/.test(password)) passedCount++;
  if (/[a-z]/.test(password)) passedCount++;
  if (/\d/.test(password)) passedCount++;
  if (/[^A-Za-z0-9]/.test(password)) passedCount++;

  if (passedCount <= 2 || password.length < 8) {
    return { score: 1, label: "Weak", color: "text-rose-400", barColor: "bg-rose-500", widthPercent: 25 };
  } else if (passedCount === 3 || passedCount === 4) {
    return { score: 2, label: "Fair", color: "text-amber-400", barColor: "bg-amber-500", widthPercent: 50 };
  } else if (passedCount === 5) {
    return { score: 3, label: "Good", color: "text-blue-400", barColor: "bg-blue-500", widthPercent: 75 };
  } else {
    return { score: 4, label: "Strong", color: "text-emerald-400", barColor: "bg-emerald-500", widthPercent: 100 };
  }
}

interface ResetPasswordViewProps {
  token?: string | null;
  email?: string | null;
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

export function ResetPasswordView({
  token,
  email: initialEmail,
  onSuccess,
  onBackToLogin,
}: ResetPasswordViewProps) {
  const router = useRouter();

  // Verification state machine: "verifying" | "valid" | "invalid" | "expired" | "used" | "success"
  const [viewState, setViewState] = useState<
    "verifying" | "valid" | "invalid" | "expired" | "used" | "success"
  >("verifying");

  const [verifiedEmail, setVerifiedEmail] = useState<string>(initialEmail || "");
  const [tokenErrorMessage, setTokenErrorMessage] = useState<string>("");
  const [isSlowVerification, setIsSlowVerification] = useState(false);

  // Form input state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<AuthErrorInfo | null>(null);

  // Recovery modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // 1. Initial Token Validation
  useEffect(() => {
    let isMounted = true;
    const slowTimer = setTimeout(() => {
      if (isMounted) setIsSlowVerification(true);
    }, 2500);

    const validateToken = async () => {
      if (!token || !token.trim()) {
        if (isMounted) {
          setViewState("invalid");
          setTokenErrorMessage("No password reset token was provided in the link.");
        }
        return;
      }

      try {
        const { data } = await authAPI.validateResetToken(token.trim());
        if (!isMounted) return;

        if (data?.valid) {
          setVerifiedEmail(data.email || initialEmail || "");
          setViewState("valid");
        } else {
          const reason = data?.reason;
          if (reason === "expired") {
            setViewState("expired");
          } else if (reason === "used") {
            setViewState("used");
          } else {
            setViewState("invalid");
          }
          setTokenErrorMessage(data?.message || "This password reset link is invalid.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        const respData = err?.response?.data;
        const reason = respData?.reason;
        const msg = respData?.message || "This password reset link is invalid or expired.";

        if (reason === "expired") {
          setViewState("expired");
        } else if (reason === "used") {
          setViewState("used");
        } else {
          setViewState("invalid");
        }
        setTokenErrorMessage(msg);
      }
    };

    validateToken();

    return () => {
      isMounted = false;
      clearTimeout(slowTimer);
    };
  }, [token, initialEmail]);

  const strength = calculatePasswordStrength(newPassword);
  const isLengthValid = newPassword.length >= 8;
  const isNumberValid = /\d/.test(newPassword);
  const isUpperValid = /[A-Z]/.test(newPassword);
  const isLowerValid = /[a-z]/.test(newPassword);
  const isSpecialValid = /[^A-Za-z0-9]/.test(newPassword);
  const isMatching = confirmPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid =
    isLengthValid && isNumberValid && isUpperValid && isLowerValid && isSpecialValid && isMatching;

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitError) setSubmitError(null);

    if (!isLengthValid || !isNumberValid || !isUpperValid || !isLowerValid || !isSpecialValid) {
      setSubmitError({
        title: "Password requirements not met",
        description: "Please ensure your password satisfies all security criteria above.",
        type: "validation",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError({
        title: "Passwords do not match",
        description: "Please verify both password fields are identical.",
        type: "validation",
      });
      return;
    }

    if (!token) {
      setSubmitError({
        title: "Missing reset token",
        description: "Please request a new password reset link.",
        type: "validation",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.resetPassword({
        token: token.trim(),
        newPassword,
        email: verifiedEmail || initialEmail || undefined,
      });
      setViewState("success");
    } catch (err: any) {
      const normalized = normalizeAuthError(err);
      setSubmitError(normalized);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    if (onSuccess) {
      onSuccess();
    } else if (onBackToLogin) {
      onBackToLogin();
    } else {
      router.push("/login");
    }
  };

  // ─── A. Verifying Loading State ───
  if (viewState === "verifying") {
    return (
      <div className="w-full text-center space-y-4 py-8 flex flex-col items-center justify-center min-h-[300px] select-none">
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
            <KeyRound className="w-8 h-8 animate-pulse text-violet-300" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white tracking-wide">
            {isSlowVerification ? "Still verifying your reset link..." : "Verifying reset link..."}
          </h3>
          <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
            Confirming security credentials with SprintForge authentication service.
          </p>
        </div>
      </div>
    );
  }

  // ─── B. Invalid / Expired / Used Token Error States ───
  if (viewState === "invalid" || viewState === "expired" || viewState === "used") {
    const isExpired = viewState === "expired";
    const isUsed = viewState === "used";

    const title = isExpired
      ? "Reset link expired"
      : isUsed
      ? "Reset link already used"
      : "Reset link is invalid";

    const subtitle = isExpired
      ? "This password reset link has expired for your security. Links are valid for 15 minutes."
      : isUsed
      ? "This reset link has already been used to update your password. Reset links can only be used once."
      : tokenErrorMessage || "This password reset link is invalid, malformed, or has already been consumed.";

    return (
      <div className="w-full text-center space-y-5 py-3">
        {/* Error Badge Icon */}
        <div className="w-14 h-14 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-[0_0_25px_rgba(244,63,94,0.25)]">
          {isExpired ? <Clock className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
            {title}
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed max-w-[320px] mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Primary Action Button: Request New Link */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            className="w-full py-3 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_24px_rgba(124,92,255,0.4)] hover:shadow-[0_0_34px_rgba(124,92,255,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Request a new password reset link</span>
          </button>

          <button
            type="button"
            onClick={handleGoToLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </button>
        </div>

        {/* Recovery Modal */}
        <ForgotPasswordModal
          isOpen={isForgotModalOpen}
          initialEmail={verifiedEmail || initialEmail || ""}
          onClose={() => setIsForgotModalOpen(false)}
        />
      </div>
    );
  }

  // ─── C. Success State ───
  if (viewState === "success") {
    return (
      <div className="w-full text-center space-y-4 py-3">
        <div className="w-14 h-14 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
            Password updated
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed max-w-[320px] mx-auto">
            Your SprintForge password has been successfully changed. You can now sign in with your new password.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGoToLogin}
          className="w-full py-3 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_24px_rgba(124,92,255,0.4)] hover:shadow-[0_0_34px_rgba(124,92,255,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          <span>Continue to sign in</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ─── D. Valid Form View ───
  return (
    <div className="w-full">
      {/* Header & User Email Identity Row */}
      <div className="mb-5 text-center space-y-1.5">
        <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto mb-2 shadow-[0_0_20px_rgba(124,58,237,0.25)]">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
          Reset your password
        </h2>
        <p className="text-xs text-slate-400 max-w-[320px] mx-auto leading-relaxed">
          Create a new password for your SprintForge account.
        </p>
        {verifiedEmail && (
          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <span>Account:</span>
            <span className="font-mono font-medium text-violet-300 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06] truncate max-w-[240px]">
              {verifiedEmail}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleResetSubmit} className="space-y-4">
        {/* New Password Field */}
        <div>
          <label
            htmlFor="reset-new-password"
            className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
          >
            New Password
          </label>
          <div
            className={`relative rounded-xl border transition-all duration-200 ${
              submitError
                ? "border-rose-500/40 bg-rose-500/[0.02]"
                : "border-white/[0.09] bg-white/[0.02] focus-within:border-violet-500 focus-within:bg-[#0c1020]"
            }`}
          >
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="reset-new-password"
              type={showNewPass ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (submitError) setSubmitError(null);
              }}
              placeholder="Create a strong password"
              required
              autoComplete="new-password"
              className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none rounded-xl font-mono"
            />
            <button
              type="button"
              onClick={() => setShowNewPass(!showNewPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none cursor-pointer"
              aria-label={showNewPass ? "Hide password" : "Show password"}
            >
              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Live Progressive Password Requirements Area */}
          <div className="mt-3 space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Password requirements
            </span>
            <div className="space-y-1.5">
              {passwordRequirements.map((r) => {
                const met = r.test(newPassword);
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-2 text-xs transition-colors duration-150 ${
                      met ? "text-emerald-400 font-medium" : "text-slate-500"
                    }`}
                  >
                    {met ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    )}
                    <span>{r.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Live Password Strength Meter */}
            {newPassword.length > 0 && (
              <div className="pt-2 mt-2 border-t border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Password strength</span>
                  <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${strength.widthPercent}%` }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`h-full rounded-full ${strength.barColor}`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="reset-confirm-password"
            className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
          >
            Confirm New Password
          </label>
          <div
            className={`relative rounded-xl border transition-all duration-200 ${
              submitError
                ? "border-rose-500/40 bg-rose-500/[0.02]"
                : confirmPassword && !isMatching
                ? "border-rose-500/40 bg-rose-500/[0.02]"
                : confirmPassword && isMatching
                ? "border-emerald-500/40 bg-emerald-500/[0.02]"
                : "border-white/[0.09] bg-white/[0.02] focus-within:border-violet-500 focus-within:bg-[#0c1020]"
            }`}
          >
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="reset-confirm-password"
              type={showConfirmPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (submitError) setSubmitError(null);
              }}
              placeholder="Re-enter your new password"
              required
              autoComplete="new-password"
              className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none rounded-xl font-mono"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none cursor-pointer"
              aria-label={showConfirmPass ? "Hide password" : "Show password"}
            >
              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Live Confirm Match Indicator */}
          {confirmPassword.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {isMatching ? (
                <div className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Passwords match</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-rose-400 font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Passwords don&apos;t match</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inline Reset Error Alert */}
        <AuthErrorAlert error={submitError} className="my-2" />

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className="w-full relative group flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_24px_rgba(124,92,255,0.4)] hover:shadow-[0_0_34px_rgba(124,92,255,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer overflow-hidden mt-1"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 pointer-events-none" />

          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Updating password...</span>
            </>
          ) : (
            <>
              <span>Reset password</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </>
          )}
        </button>

        {/* Security Note Footer */}
        <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Your password is encrypted with bcrypt and stored securely.</span>
        </div>
      </form>
    </div>
  );
}
