"use client";

import { useState, Suspense } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";
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

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const prefillEmail = searchParams.get("email");
  const shouldReduceMotion = useReducedMotion();

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

  const strength = calculatePasswordStrength(password);

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
        {/* ── 1. Status Indicator ── */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold tracking-widest font-mono uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span>SprintForge Workspace</span>
          </div>
        </motion.div>

        {/* ── 2. Form Header ── */}
        <motion.div variants={itemVariants} className="space-y-1 mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Create your account
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed font-normal">
            Start building better software in minutes.
          </p>
        </motion.div>

        {/* ── 3. Google Single Sign-On Button ── */}
        <motion.div variants={itemVariants} className="mb-4 sm:mb-5">
          <GoogleAuthButton nextUrl={nextUrl} text="signup_with" onError={setSignupError} />
        </motion.div>

        {/* ── 4. Clean Modern Hairline Divider ── */}
        <motion.div
          variants={itemVariants}
          className="relative flex items-center justify-center my-4 sm:my-5"
        >
          <div className="border-t border-white/[0.08] w-full" />
          <span className="bg-[#090d1f] px-3 text-[11px] text-slate-500 font-medium tracking-normal absolute">
            or register with email
          </span>
        </motion.div>

        {/* ── 5. Registration Form ── */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name Field */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider"
            >
              Full Name
            </label>
            <div
              className={`relative rounded-xl border transition-all duration-200 ${
                isFocused === "name"
                  ? "border-violet-500 shadow-[0_0_20px_rgba(124,92,255,0.22)] bg-[#0b0f24]"
                  : signupError
                  ? "border-rose-500/45 bg-rose-500/[0.02]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.03]"
              }`}
            >
              <div
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  signupError
                    ? "text-rose-400"
                    : isFocused === "name"
                    ? "text-violet-400"
                    : "text-slate-500"
                }`}
              >
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
          </motion.div>

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
                  : signupError
                  ? "border-rose-500/45 bg-rose-500/[0.02]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.03]"
              }`}
            >
              <div
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  signupError
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
          </motion.div>

          {/* Password Field */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider"
            >
              Password
            </label>
            <div
              className={`relative rounded-xl border transition-all duration-200 ${
                isFocused === "password"
                  ? "border-violet-500 shadow-[0_0_20px_rgba(124,92,255,0.22)] bg-[#0b0f24]"
                  : signupError
                  ? "border-rose-500/45 bg-rose-500/[0.02]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.03]"
              }`}
            >
              <div
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  signupError
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
                  if (signupError) setSignupError(null);
                }}
                onFocus={() => setIsFocused("password")}
                onBlur={() => setIsFocused(null)}
                placeholder="Create a strong password"
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

            {/* Live Password Requirements Area */}
            <div className="mt-2.5 space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Password requirements
              </span>
              <div className="space-y-1.5">
                {passwordRequirements.map((r) => {
                  const met = r.test(password);
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
              {password.length > 0 && (
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
          </motion.div>

          {/* ── Contextual Inline Error & CTA Button ── */}
          <motion.div variants={itemVariants} className="space-y-2.5 pt-1">
            <AuthErrorAlert error={signupError} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group flex items-center justify-center gap-2 py-3 sm:py-3.5 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_24px_rgba(124,92,255,0.4)] hover:shadow-[0_0_34px_rgba(124,92,255,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 pointer-events-none" />

              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        {/* ── 6. Switch to Login ── */}
        <motion.div
          variants={itemVariants}
          className="text-center text-xs sm:text-sm text-slate-400 mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-white/[0.06] flex items-center justify-center gap-1.5"
        >
          <span>Already have an account?</span>
          <Link
            href="/login"
            className="group text-violet-400 hover:text-violet-300 font-semibold transition-colors inline-flex items-center gap-0.5 hover:underline"
          >
            <span>Sign in to workspace</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
        </motion.div>

        {/* ── 7. Honest Security Notice ── */}
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
        {/* ─── Left Side: Product Showcase & Visual Story (PRESERVED) ─── */}
        <section className="hidden lg:flex lg:w-[56%] xl:w-[58%] 2xl:w-[60%] h-full flex-col justify-center items-start min-h-0 relative">
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

          <div className="w-full flex-1 min-h-0 flex items-center justify-center relative">
            <Agile3DWorkspace variant="signup" />
          </div>
        </section>

        {/* ─── Right Side: Premium Floating Authentication Surface ─── */}
        <section className="w-full lg:w-[44%] xl:w-[42%] 2xl:w-[40%] flex items-center justify-center relative z-20 min-h-0 py-2 sm:py-4">
          {/* Subtle slow ambient breathing glow behind floating card */}
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
            {/* Subtle Top Card Highlight */}
            <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent pointer-events-none" />

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
