"use client";

import { useState, Suspense } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Shield,
  Mail,
  Lock,
  User,
  CheckCircle2,
  Circle,
} from "lucide-react";
import toast from "react-hot-toast";
import { GoogleAuthButton } from "@/components/shared/GoogleAuthButton";
import { SprintForgeLogo } from "@/components/shared/SprintForgeLogo";
import { Agile3DWorkspace } from "@/components/auth/Agile3DWorkspace";
import { OtpVerificationView } from "@/components/auth/OtpVerificationView";
import { AuthErrorAlert, normalizeAuthError, AuthErrorInfo } from "@/components/auth/AuthErrorAlert";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains a number", test: (p: string) => /\d/.test(p) },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const prefillEmail = searchParams.get("email");

  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail || "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<AuthErrorInfo | null>(null);
  const [verificationState, setVerificationState] = useState<{
    tempToken?: string;
    email: string;
    maskedEmail?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupError) setSignupError(null);

    if (!name.trim()) {
      setSignupError({
        title: "Name is required",
        description: "Please enter your full name to set up your profile.",
        type: "validation",
      });
      return;
    }
    if (!email.trim()) {
      setSignupError({
        title: "Work email is required",
        description: "Please enter a valid work email address.",
        type: "validation",
      });
      return;
    }
    if (password.length < 8) {
      setSignupError({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        type: "validation",
      });
      return;
    }
    if (!/\d/.test(password)) {
      setSignupError({
        title: "Password requirement missing",
        description: "Password must contain at least one number.",
        type: "validation",
      });
      return;
    }

    try {
      const result = await register(name.trim(), email.trim(), password);
      if (result.verificationRequired) {
        setVerificationState({
          tempToken: result.tempToken,
          email: result.email || email.trim(),
          maskedEmail: result.maskedEmail,
        });
        return;
      }

      toast.success("Account created! Welcome to SprintForge 🚀");
      router.push(nextUrl || "/dashboard");
    } catch (err: any) {
      const normalized = normalizeAuthError(err);
      setSignupError(normalized);
    }
  };

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
      <div className="mb-4 sm:mb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display mb-1">
          Create your account
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Start building better software in minutes.
        </p>
      </div>

      {/* Google Single Sign-On Button */}
      <div className="mb-4">
        <GoogleAuthButton nextUrl={nextUrl} text="signup_with" onError={setSignupError} />
      </div>

      {/* Subtle Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-white/[0.08] w-full" />
        <span className="bg-[#090d1b] px-3 text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold tracking-wider absolute rounded-full border border-white/[0.06]">
          or register with email
        </span>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
        {/* Full Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
          >
            Full Name
          </label>
          <div
            className={`relative rounded-xl border transition-all duration-200 ${
              isFocused === "name"
                ? "border-violet-500 shadow-[0_0_20px_rgba(124,92,255,0.25)] bg-[#0c1020]"
                : signupError
                ? "border-rose-500/45 bg-rose-500/[0.02]"
                : "border-white/[0.09] bg-white/[0.02] hover:border-white/[0.18]"
            }`}
          >
            <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              signupError ? "text-rose-400" : "text-slate-500"
            }`}>
              <User className="w-4 h-4" />
            </div>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (signupError) setSignupError(null);
              }}
              onFocus={() => setIsFocused("name")}
              onBlur={() => setIsFocused(null)}
              placeholder="Your full name"
              required
              autoComplete="name"
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none rounded-xl"
            />
          </div>
        </div>

        {/* Work Email Field */}
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
                : signupError
                ? "border-rose-500/45 bg-rose-500/[0.02]"
                : "border-white/[0.09] bg-white/[0.02] hover:border-white/[0.18]"
            }`}
          >
            <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              signupError ? "text-rose-400" : "text-slate-500"
            }`}>
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (signupError) setSignupError(null);
              }}
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
          <label
            htmlFor="password"
            className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
          >
            Password
          </label>
          <div
            className={`relative rounded-xl border transition-all duration-200 ${
              isFocused === "password"
                ? "border-violet-500 shadow-[0_0_20px_rgba(124,92,255,0.25)] bg-[#0c1020]"
                : signupError
                ? "border-rose-500/45 bg-rose-500/[0.02]"
                : "border-white/[0.09] bg-white/[0.02] hover:border-white/[0.18]"
            }`}
          >
            <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              signupError ? "text-rose-400" : "text-slate-500"
            }`}>
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (signupError) setSignupError(null);
              }}
              onFocus={() => setIsFocused("password")}
              onBlur={() => setIsFocused(null)}
              placeholder="••••••••••••"
              required
              autoComplete="new-password"
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

          {/* Real-time Password Requirements Indicator */}
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            {passwordRules.map((r) => {
              const pass = r.test(password);
              return (
                <div
                  key={r.label}
                  className={`flex items-center gap-1 transition-colors duration-150 ${
                    pass ? "text-emerald-400 font-medium" : "text-slate-500"
                  }`}
                >
                  {pass ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>{r.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Contextual Inline Authentication Error (Directly above Submit button) ── */}
        <AuthErrorAlert error={signupError} className="my-2" />

        {/* Primary Create Account Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full relative group flex items-center justify-center gap-2 py-3 sm:py-3.5 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_24px_rgba(124,92,255,0.4)] hover:shadow-[0_0_34px_rgba(124,92,255,0.65)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2 cursor-pointer overflow-hidden"
        >
          {/* Subtle button sheen animation */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 pointer-events-none" />

          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Creating workspace...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Sign In */}
      <div className="text-center text-xs sm:text-sm text-slate-400 mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-white/[0.06]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-violet-400 hover:text-violet-300 font-semibold transition-colors hover:underline"
        >
          Sign in
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
    </div>
  );
}

export default function SignupPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-svh lg:h-svh w-full bg-[#05070d] text-slate-100 flex flex-col overflow-x-hidden lg:overflow-hidden relative selection:bg-violet-500/30 selection:text-white">
      {/* ─── Top Navigation Bar (Logo + Sign In Link) ─── */}
      <header className="w-full flex-shrink-0 z-30 px-6 sm:px-8 xl:px-12 py-3.5 sm:py-4 xl:py-5 flex items-center justify-between border-b border-white/[0.03] lg:border-none">
        <SprintForgeLogo href="/" size="md" showBadge={true} badgeText="Agile AI" priority />
        <Link
          href="/login"
          className="text-xs font-medium text-slate-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] transition-all duration-200 inline-flex items-center gap-1.5"
        >
          <span>Sign in</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      {/* ─── Main Content Workspace ─── */}
      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 xl:gap-12 pb-4 sm:pb-6 lg:pb-6">
        {/* ─── Left Side: Product Showcase & Visual Story ─── */}
        <section className="hidden lg:flex lg:w-[56%] xl:w-[58%] 2xl:w-[60%] h-full flex-col justify-center items-start min-h-0 relative">
          {/* Top-Left Product Headline */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="w-full max-w-xl mb-4 xl:mb-5 flex-shrink-0 pointer-events-none"
          >
            <span className="text-[10px] xl:text-[11px] font-bold text-violet-400 uppercase tracking-widest block mb-1 font-mono">
              Autonomous Agile Engine
            </span>
            <h2 className="text-2xl xl:text-3xl 2xl:text-[32px] font-black text-white tracking-tight font-display mb-1">
              Build better software, <span className="gradient-text">together.</span>
            </h2>
            <p className="text-xs xl:text-sm text-slate-400 leading-relaxed font-normal">
              Create your workspace, bring your team together, and start shipping with confidence.
            </p>
          </motion.div>

          {/* Interactive Workspace Preview */}
          <div className="w-full flex-1 min-h-0 flex items-center justify-center relative">
            <Agile3DWorkspace variant="signup" />
          </div>
        </section>

        {/* ─── Right Side: Minimal Glass Authentication Panel ─── */}
        <section className="w-full lg:w-[44%] xl:w-[42%] 2xl:w-[40%] flex items-center justify-center relative z-20 min-h-0 py-2 sm:py-4">
          {/* Ambient Subtle Glow Behind Auth Card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[440px] h-[380px] sm:h-[440px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

          {/* Floating Frosted Glass Authentication Card */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[430px] bg-[#090d1b]/80 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-7 xl:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(124,92,255,0.08)] relative overflow-hidden"
          >
            {/* Subtle Top Card Highlight */}
            <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

            {/* Suspense-wrapped signup form */}
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center min-h-[360px] text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-3" />
                  <p className="text-xs font-medium">Loading registration...</p>
                </div>
              }
            >
              <SignupForm />
            </Suspense>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
