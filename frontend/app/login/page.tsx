"use client";

import { useState, Suspense } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { Eye, EyeOff, Loader2, ArrowRight, Shield, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { GoogleAuthButton } from "@/components/shared/GoogleAuthButton";
import { SprintForgeLogo } from "@/components/shared/SprintForgeLogo";
import { Agile3DWorkspace } from "@/components/auth/Agile3DWorkspace";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      await login(email.trim(), password);
      toast.success("Welcome back! 🎉");
      router.push(nextUrl || "/dashboard");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Login failed. Please verify your credentials."
      );
    }
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
            <Link
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                toast("Password reset instructions will be sent to your registered email.", { icon: "🔑" });
              }}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium hover:underline"
            >
              Forgot password?
            </Link>
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
          {/* Subtle button sheen animation */}
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
          {/* Top-Left Product Headline */}
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

          {/* The Live Interactive 3D Agile Workspace Scene Container */}
          <div className="w-full flex-1 min-h-0 flex items-center justify-center relative">
            <Agile3DWorkspace />
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

            {/* Suspense-wrapped login form */}
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

