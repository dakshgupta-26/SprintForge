"use client";

import { Suspense } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { SprintForgeLogo } from "@/components/shared/SprintForgeLogo";
import { Agile3DWorkspace } from "@/components/auth/Agile3DWorkspace";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";

function ResetPasswordContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  return (
    <ResetPasswordView
      token={token}
      email={email}
      onSuccess={() => router.push("/login")}
      onBackToLogin={() => router.push("/login")}
    />
  );
}

export default function ResetPasswordPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-svh lg:h-svh w-full bg-[#05070d] text-slate-100 flex flex-col overflow-x-hidden lg:overflow-hidden relative selection:bg-violet-500/30 selection:text-white">
      {/* ─── Top Navigation Bar (Logo + Quick Exit Link) ─── */}
      <header className="w-full flex-shrink-0 z-30 px-6 sm:px-8 xl:px-12 py-3.5 sm:py-4 xl:py-5 flex items-center justify-between border-b border-white/[0.03] lg:border-none">
        <SprintForgeLogo href="/" size="md" showBadge={true} badgeText="Agile AI" priority />
        <Link
          href="/login"
          className="text-xs font-medium text-slate-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] transition-all duration-200 inline-flex items-center gap-1.5"
        >
          <span>Return to Sign in</span>
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
              Account Security & Recovery
            </span>
            <h2 className="text-2xl xl:text-3xl 2xl:text-[32px] font-black text-white tracking-tight font-display mb-1">
              Reset your password, <span className="gradient-text">securely.</span>
            </h2>
            <p className="text-xs xl:text-sm text-slate-400 leading-relaxed font-normal">
              SprintForge protects your credentials with zero-knowledge token validation and end-to-end encryption.
            </p>
          </motion.div>

          <div className="w-full flex-1 min-h-0 flex items-center justify-center relative">
            <Agile3DWorkspace />
          </div>
        </section>

        {/* ─── Right Side: Premium Floating Reset Password Surface ─── */}
        <section className="w-full lg:w-[44%] xl:w-[42%] 2xl:w-[40%] flex items-center justify-center relative z-20 min-h-0 py-2 sm:py-4">
          {/* Ambient Glows */}
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
                  <p className="text-xs font-medium">Verifying reset link...</p>
                </div>
              }
            >
              <ResetPasswordContainer />
            </Suspense>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
