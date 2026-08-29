"use client";

import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { GoogleAuthButton } from "@/components/shared/GoogleAuthButton";
import { SprintForgeLogo } from "@/components/shared/SprintForgeLogo";
import { Agile3DWorkspace } from "@/components/auth/Agile3DWorkspace";
import { OtpVerificationView } from "@/components/auth/OtpVerificationView";

// ─── Reset Password View Component ────────────────────────────────────────────
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
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/\d/.test(newPassword)) {
      toast.error("Password must contain at least one number");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.resetPassword({
        token,
        email,
        newPassword,
      });
      toast.success("Password reset successfully! Please sign in.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto mb-3 shadow-[0_0_20px_rgba(124,58,237,0.25)]">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
          Set New Password
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter a new secure password for <strong className="text-violet-300">{email}</strong>
        </p>
      </div>

      <form onSubmit={handleResetSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            New Password
          </label>
          <div className="relative rounded-xl border border-white/[0.09] bg-white/[0.02] focus-within:border-violet-500">
            <input
              type={showPass ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="•••••••••••• (min 8 chars)"
              required
              className="w-full pl-4 pr-11 py-2.5 bg-transparent text-white text-sm focus:outline-none rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Confirm Password
          </label>
          <div className="relative rounded-xl border border-white/[0.09] bg-white/[0.02] focus-within:border-violet-500">
            <input
              type={showPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              required
              className="w-full pl-4 pr-11 py-2.5 bg-transparent text-white text-sm focus:outline-none rounded-xl"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !newPassword || newPassword !== confirmPassword}
          className="w-full py-3 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>Update Password & Sign In</span>
        </button>
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

  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingForgot, setIsSendingForgot] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // First-time OTP verification challenge state
  const [verificationState, setVerificationState] = useState<{
    tempToken?: string;
    email: string;
    maskedEmail?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      const result = await login(email.trim(), password);
      if (result.verificationRequired) {
        toast("First-time verification code sent to your email.", { icon: "🔐" });
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
      toast.error(
        err?.response?.data?.message || "Login failed. Please verify your credentials."
      );
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Please enter your account email");
      return;
    }

    setIsSendingForgot(true);
    try {
      await authAPI.forgotPassword({ email: forgotEmail.trim() });
      setForgotSubmitted(true);
      toast.success("Instructions sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setIsSendingForgot(false);
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

      {/* Form Header */}
      <div className="mb-5 xl:mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display mb-1">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Sign in to your SprintForge workspace
        </p>
      </div>

      {/* Google Single Sign-On Button */}
      <div className="mb-4 sm:mb-5">
        <GoogleAuthButton nextUrl={nextUrl} text="signin_with" />
      </div>

      {/* Subtle Divider */}
      <div className="relative flex items-center justify-center my-4 sm:my-5">
        <div className="border-t border-white/[0.08] w-full" />
        <span className="bg-[#090d1b] px-3 text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold tracking-wider absolute rounded-full border border-white/[0.06]">
          or continue with email
        </span>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
          >
            Work Email
          </label>
          <div
            className={`relative rounded-xl border transition-all duration-200 ${
              isFocused === "email"
                ? "border-violet-500 shadow-[0_0_20px_rgba(124,92,255,0.25)] bg-[#0c1020]"
                : "border-white/[0.09] bg-white/[0.02] hover:border-white/[0.18]"
            }`}
          >
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused("email")}
              onBlur={() => setIsFocused(null)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none rounded-xl"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setForgotSubmitted(false);
                setIsForgotModalOpen(true);
              }}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div
            className={`relative rounded-xl border transition-all duration-200 ${
              isFocused === "password"
                ? "border-violet-500 shadow-[0_0_20px_rgba(124,92,255,0.25)] bg-[#0c1020]"
                : "border-white/[0.09] bg-white/[0.02] hover:border-white/[0.18]"
            }`}
          >
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>

        {/* Primary Sign In Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full relative group flex items-center justify-center gap-2 py-3 sm:py-3.5 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_24px_rgba(124,92,255,0.4)] hover:shadow-[0_0_34px_rgba(124,92,255,0.65)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2 cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 pointer-events-none" />

          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign in to Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="text-center text-xs sm:text-sm text-slate-400 mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-white/[0.06]">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-violet-400 hover:text-violet-300 font-semibold transition-colors hover:underline"
        >
          Create one free
        </Link>
      </div>

      {/* Legal & Security Compliance Footer */}
      <div className="text-center text-[10px] sm:text-[11px] text-slate-500 mt-3 sm:mt-3.5 flex items-center justify-center gap-3 sm:gap-4">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-emerald-400" />
          SOC-2 Compliant
        </span>
        <span>•</span>
        <Link href="/terms" className="hover:text-slate-400 transition-colors">
          Terms
        </Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-slate-400 transition-colors">
          Privacy
        </Link>
      </div>

      {/* ─── Forgot Password Modal ─── */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="fixed inset-0" onClick={() => setIsForgotModalOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#090d20] border border-violet-500/30 rounded-3xl shadow-2xl z-10 overflow-hidden p-6 sm:p-7 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Reset your password</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your registered work email and we&apos;ll send you a secure link to reset your password.
                </p>
              </div>

              {forgotSubmitted ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-emerald-300 font-medium">
                    If an account exists with this email, a reset link has been dispatched.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    The reset link will expire in 15 minutes.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="mt-2 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Close & Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Work Email
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.09] focus:border-violet-500 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingForgot || !forgotEmail.trim()}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      {isSendingForgot && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Send Reset Link</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
        {/* ─── Left Side: Immersive 3D Agile Workspace Hero Stage ─── */}
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

        {/* ─── Right Side: Minimal Glass Authentication Panel ─── */}
        <section className="w-full lg:w-[44%] xl:w-[42%] 2xl:w-[40%] flex items-center justify-center relative z-20 min-h-0 py-2 sm:py-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[440px] h-[380px] sm:h-[440px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[430px] bg-[#090d1b]/80 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-7 xl:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(124,92,255,0.08)] relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

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
