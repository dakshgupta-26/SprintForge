"use client";

import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion, Variants } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { authAPI } from "@/lib/api";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Shield,
  Mail,
  Lock,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  Circle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { GoogleAuthButton } from "@/components/shared/GoogleAuthButton";
import { SprintForgeLogo } from "@/components/shared/SprintForgeLogo";
import { Agile3DWorkspace } from "@/components/auth/Agile3DWorkspace";
import { OtpVerificationView } from "@/components/auth/OtpVerificationView";
import { AuthErrorAlert, normalizeAuthError, AuthErrorInfo } from "@/components/auth/AuthErrorAlert";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";

// ─── Live Password Requirements & Strength Evaluator ─────────────────────────
const passwordRequirements = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "number", label: "Contains a number", test: (p: string) => /\d/.test(p) },
  { id: "uppercase", label: "Contains an uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "Contains a lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "special", label: "Contains a special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
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
  if (/\d/.test(password)) passedCount++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) passedCount++;
  if (/[^A-Za-z0-9]/.test(password)) passedCount++;

  if (passedCount <= 1 || password.length < 8) {
    return { score: 1, label: "Weak", color: "text-rose-400", barColor: "bg-rose-500", widthPercent: 25 };
  } else if (passedCount === 2 || passedCount === 3) {
    return { score: 2, label: "Fair", color: "text-amber-400", barColor: "bg-amber-500", widthPercent: 50 };
  } else if (passedCount === 4) {
    return { score: 3, label: "Good", color: "text-blue-400", barColor: "bg-blue-500", widthPercent: 75 };
  } else {
    return { score: 4, label: "Strong", color: "text-emerald-400", barColor: "bg-emerald-500", widthPercent: 100 };
  }
}

// ─── Set New Password View Component ──────────────────────────────────────────
function ResetPasswordView({
  token,
  email,
  onSuccess,
}: {
  token: string;
  email: string;
  onSuccess: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetError, setResetError] = useState<AuthErrorInfo | null>(null);

  const strength = calculatePasswordStrength(newPassword);
  const isBaseValid = newPassword.length >= 8 && /\d/.test(newPassword);
  const isMatching = confirmPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = isBaseValid && isMatching;

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetError) setResetError(null);

    if (newPassword.length < 8) {
      setResetError({
        title: "Weak password",
        description: "Password must be at least 8 characters long.",
        type: "validation",
      });
      return;
    }
    if (!/\d/.test(newPassword)) {
      setResetError({
        title: "Password requirement not met",
        description: "Password must contain at least one numeric digit.",
        type: "validation",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError({
        title: "Passwords do not match",
        description: "Please verify both password fields are identical.",
        type: "validation",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.resetPassword({
        token,
        email,
        newPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setResetError(normalizeAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full text-center space-y-4 py-2">
        <div className="w-14 h-14 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
            Password updated successfully
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed max-w-[320px] mx-auto">
            Your password has been changed securely. You can now continue to SprintForge.
          </p>
        </div>
        <button
          type="button"
          onClick={onSuccess}
          className="w-full py-3 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_24px_rgba(124,92,255,0.4)] hover:shadow-[0_0_34px_rgba(124,92,255,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          <span>Continue to SprintForge</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header & User Email Context */}
      <div className="mb-5 text-center space-y-1.5">
        <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto mb-2 shadow-[0_0_20px_rgba(124,58,237,0.25)]">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
          Set a new password
        </h2>
        <p className="text-xs text-slate-400 max-w-[320px] mx-auto leading-relaxed">
          Choose a strong password to keep your SprintForge account secure.
        </p>
        <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <span>Changing password for</span>
          <span className="font-mono font-medium text-violet-300 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06] truncate max-w-[220px]">
            {email}
          </span>
        </div>
      </div>

      <form onSubmit={handleResetSubmit} className="space-y-4">
        {/* New Password Field */}
        <div>
          <label
            htmlFor="new-password"
            className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
          >
            New Password
          </label>
          <div
            className={`relative rounded-xl border transition-all duration-200 ${
              resetError
                ? "border-rose-500/40 bg-rose-500/[0.02]"
                : "border-white/[0.09] bg-white/[0.02] focus-within:border-violet-500 focus-within:bg-[#0c1020]"
            }`}
          >
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="new-password"
              type={showNewPass ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (resetError) setResetError(null);
              }}
              placeholder="Enter your new password"
              required
              autoComplete="new-password"
              className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none rounded-xl"
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

          {/* Live Password Requirements Area */}
          <div className="mt-3 space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Password requirements
            </span>
            <div className="space-y-1.5">
              {passwordRequirements.map((r) => {
                const met = r.test(newPassword);
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
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
            htmlFor="confirm-password"
            className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
          >
            Confirm Password
          </label>
          <div
            className={`relative rounded-xl border transition-all duration-200 ${
              resetError
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
              id="confirm-password"
              type={showConfirmPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (resetError) setResetError(null);
              }}
              placeholder="Re-enter your new password"
              required
              autoComplete="new-password"
              className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none rounded-xl"
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
        <AuthErrorAlert error={resetError} className="my-2" />

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
              <span>Update Password</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </>
          )}
        </button>

        {/* Security Note Footer */}
        <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Your password is encrypted and securely stored.</span>
        </div>
      </form>
    </div>
  );
}

// ─── Main Login Form Component ────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const mode = searchParams.get("mode");
  const resetToken = searchParams.get("token");
  const resetEmail = searchParams.get("email");
  const shouldReduceMotion = useReducedMotion();

  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // First-time OTP verification challenge state
  const [verificationState, setVerificationState] = useState<{
    tempToken?: string;
    email: string;
    maskedEmail?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authError) setAuthError(null);

    if (!email.trim() || !password) {
      setAuthError({
        title: "Invalid email or password",
        description: "Check your credentials and try again.",
        type: "validation",
      });
      return;
    }

    try {
      const result = await login(email.trim(), password);
      if (result.verificationRequired) {
        setVerificationState({
          tempToken: result.tempToken,
          email: result.email || email.trim(),
          maskedEmail: result.maskedEmail,
        });
        return;
      }

      toast.success("Welcome back! 🎉");
      router.push(nextUrl || "/dashboard");
    } catch (err: any) {
      // Show error directly inside the login form — NEVER in top-right toast!
      const normalized = normalizeAuthError(err);
      setAuthError(normalized);
    }
  };

  // If URL has reset password parameters
  if (mode === "reset" && resetToken && resetEmail) {
    return (
      <ResetPasswordView
        token={resetToken}
        email={resetEmail}
        onSuccess={() => router.push("/login")}
      />
    );
  }

  // If first-time OTP verification required
  if (verificationState) {
    return (
      <OtpVerificationView
        tempToken={verificationState.tempToken}
        email={verificationState.email}
        maskedEmail={verificationState.maskedEmail}
        onSuccess={() => router.push(nextUrl || "/dashboard")}
        onBackToLogin={() => setVerificationState(null)}
      />
    );
  }

  // Staggered motion variants for right-side auth content
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
        delayChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
  };

  return (
    <div className="w-full">
      {/* Mobile-only Branding Header */}
      <div className="mb-5 flex lg:hidden items-center justify-between">
        <SprintForgeLogo href="/" size="sm" showBadge={true} badgeText="Agile AI" />
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sprint 24 • 95%</span>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full"
      >
        {/* ── 1. Top Small Status / Brand Indicator ── */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold tracking-widest font-mono uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span>SprintForge Workspace</span>
          </div>
        </motion.div>

        {/* ── 2. Welcome Heading & Subtitle ── */}
        <motion.div variants={itemVariants} className="space-y-1 mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Welcome back
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed font-normal">
            Sign in to your SprintForge workspace
          </p>
        </motion.div>

        {/* ── 3. Google Single Sign-On Button ── */}
        <motion.div variants={itemVariants} className="mb-4 sm:mb-5">
          <GoogleAuthButton nextUrl={nextUrl} text="signin_with" onError={setAuthError} />
        </motion.div>

        {/* ── 4. Clean Modern Divider ── */}
        <motion.div
          variants={itemVariants}
          className="relative flex items-center justify-center my-4 sm:my-5"
        >
          <div className="border-t border-white/[0.08] w-full" />
          <span className="bg-[#090d1f] px-3 text-[11px] text-slate-500 font-medium tracking-normal absolute">
            or continue with email
          </span>
        </motion.div>

        {/* ── 5. Email & Password Form ── */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Work Email Field */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider"
            >
              Work Email
            </label>
            <div
              className={`relative rounded-xl border transition-all duration-200 ${
                isFocused === "email"
                  ? "border-violet-500 shadow-[0_0_20px_rgba(124,92,255,0.22)] bg-[#0b0f24]"
                  : authError
                  ? "border-rose-500/45 bg-rose-500/[0.02] shadow-[0_0_12px_rgba(244,63,94,0.08)]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.03]"
              }`}
            >
              <div
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  authError
                    ? "text-rose-400"
                    : isFocused === "email"
                    ? "text-violet-400"
                    : "text-slate-500"
                }`}
              >
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (authError) setAuthError(null);
                }}
                onFocus={() => setIsFocused("email")}
                onBlur={() => setIsFocused(null)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none rounded-xl"
              />
            </div>
          </motion.div>

          {/* Password Field */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div
              className={`relative rounded-xl border transition-all duration-200 ${
                isFocused === "password"
                  ? "border-violet-500 shadow-[0_0_20px_rgba(124,92,255,0.22)] bg-[#0b0f24]"
                  : authError
                  ? "border-rose-500/45 bg-rose-500/[0.02] shadow-[0_0_12px_rgba(244,63,94,0.08)]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.03]"
              }`}
            >
              <div
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  authError
                    ? "text-rose-400"
                    : isFocused === "password"
                    ? "text-violet-400"
                    : "text-slate-500"
                }`}
              >
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (authError) setAuthError(null);
                }}
                onFocus={() => setIsFocused("password")}
                onBlur={() => setIsFocused(null)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none cursor-pointer"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          {/* ── Contextual Inline Authentication Error & Primary CTA ── */}
          <motion.div variants={itemVariants} className="space-y-2.5 pt-1">
            <AuthErrorAlert error={authError} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group flex items-center justify-center gap-2 py-3 sm:py-3.5 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_24px_rgba(124,92,255,0.4)] hover:shadow-[0_0_34px_rgba(124,92,255,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 pointer-events-none" />

              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in to Workspace...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        {/* ── 6. Switch to Signup ── */}
        <motion.div
          variants={itemVariants}
          className="text-center text-xs sm:text-sm text-slate-400 mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-white/[0.06] flex items-center justify-center gap-1.5"
        >
          <span>New to SprintForge?</span>
          <Link
            href="/signup"
            className="group text-violet-400 hover:text-violet-300 font-semibold transition-colors inline-flex items-center gap-0.5 hover:underline"
          >
            <span>Create your workspace</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
        </motion.div>

        {/* ── 7. Honest Security & Compliance Footer ── */}
        <motion.div
          variants={itemVariants}
          className="text-center text-[10px] sm:text-[11px] text-slate-500 mt-3 sm:mt-3.5 flex items-center justify-center gap-2.5 sm:gap-3"
        >
          <span className="flex items-center gap-1 text-slate-400 font-medium">
            <Shield className="w-3 h-3 text-emerald-400" />
            Secure authentication
          </span>
          <span>•</span>
          <Link href="/terms" className="hover:text-slate-400 transition-colors">
            Terms
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">
            Privacy
          </Link>
        </motion.div>
      </motion.div>

      {/* ─── Production-Grade Authentication Recovery Modal ─── */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        initialEmail={email}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
}

export default function LoginPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-svh lg:h-svh w-full bg-[#05070d] text-slate-100 flex flex-col overflow-x-hidden lg:overflow-hidden relative selection:bg-violet-500/30 selection:text-white">
      {/* ─── Top Navigation Bar (Logo + Quick Exit Link) ─── */}
      <header className="w-full flex-shrink-0 z-30 px-6 sm:px-8 xl:px-12 py-3.5 sm:py-4 xl:py-5 flex items-center justify-between border-b border-white/[0.03] lg:border-none">
        <SprintForgeLogo href="/" size="md" showBadge={true} badgeText="Agile AI" priority />
        <Link
          href="/"
          className="text-xs font-medium text-slate-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] transition-all duration-200 inline-flex items-center gap-1.5"
        >
          <span>Return Home</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      {/* ─── Main Content Workspace ─── */}
      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 xl:gap-12 pb-4 sm:pb-6 lg:pb-6">
        {/* ─── Left Side: Immersive 3D Agile Workspace Hero Stage (EXACTLY PRESERVED) ─── */}
        <section className="hidden lg:flex lg:w-[56%] xl:w-[58%] 2xl:w-[60%] h-full flex-col justify-center items-start min-h-0 relative">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="w-full max-w-xl mb-3 xl:mb-4 flex-shrink-0 pointer-events-none"
          >
            <span className="text-[10px] xl:text-[11px] font-bold text-violet-400 uppercase tracking-widest block mb-1 font-mono">
              Autonomous Agile Engine
            </span>
            <h2 className="text-2xl xl:text-3xl 2xl:text-[32px] font-black text-white tracking-tight font-display mb-1">
              Ship better software, <span className="gradient-text">together.</span>
            </h2>
            <p className="text-xs xl:text-sm text-slate-400 leading-relaxed font-normal">
              Plan sprints, align your team, and turn ideas into shipped software with predictive AI insights.
            </p>
          </motion.div>

          <div className="w-full flex-1 min-h-0 flex items-center justify-center relative">
            <Agile3DWorkspace />
          </div>
        </section>

        {/* ─── Right Side: Premium Floating Authentication Surface ─── */}
        <section className="w-full lg:w-[44%] xl:w-[42%] 2xl:w-[40%] flex items-center justify-center relative z-20 min-h-0 py-2 sm:py-4">
          {/* Subtle slow ambient glowing lights behind the floating surface */}
          <motion.div
            animate={{
              scale: shouldReduceMotion ? 1 : [1, 1.08, 1],
              opacity: [0.35, 0.55, 0.35],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-12 -right-12 w-[340px] h-[340px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none -z-10"
          />
          <motion.div
            animate={{
              scale: shouldReduceMotion ? 1 : [1, 1.12, 1],
              opacity: [0.25, 0.45, 0.25],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute -bottom-10 -left-10 w-[300px] h-[300px] bg-indigo-600/15 rounded-full blur-[90px] pointer-events-none -z-10"
          />

          {/* Floating Authentication Card */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[430px] bg-[#090d1f]/85 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.09),transparent_60%)] border border-white/[0.08] dark:border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-7 xl:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(124,92,255,0.08)] relative overflow-hidden"
          >
            {/* Top Subtle Violet Ambient Gradient Sheen */}
            <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent pointer-events-none" />

            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center min-h-[360px] text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-3" />
                  <p className="text-xs font-medium">Loading workspace sign in...</p>
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
