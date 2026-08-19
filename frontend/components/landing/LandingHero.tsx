"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Play, Terminal } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Ambient Radiance */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[450px] bg-gradient-to-br from-violet-600/20 via-indigo-600/15 to-purple-800/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-grid-faint opacity-60 pointer-events-none -z-10" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#05070d] to-transparent pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Announcement Pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-violet-500/30 backdrop-blur-md mb-8 group hover:border-violet-500/60 transition-colors cursor-pointer"
          onClick={() => {
            document.getElementById("ai-advantage")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-500/20 text-violet-300">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="text-xs font-medium text-slate-200">
            Introducing <span className="text-violet-300 font-semibold">AI-Powered Sprint Planning</span>
          </span>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm">
            NEW
          </span>
        </motion.div>

        {/* Hero Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-black tracking-tight text-white leading-[1.08] mb-6 font-display"
        >
          Where Great Teams <br className="hidden sm:inline" />
          <span className="gradient-text">Build Better Software.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 font-normal"
        >
          Plan sprints with AI velocity insights, execute with lightning-fast Kanban boards, collaborate in real time, and ship with total confidence — all in one unified workspace.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <Link
            href="/signup"
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm sm:text-base font-semibold text-white rounded-xl btn-primary-glow"
          >
            <span>Start building free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
          <a
            href="#interactive-demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-medium text-slate-300 rounded-xl btn-secondary-glass"
          >
            <Play className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
            <span>Explore live workspace</span>
          </a>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 font-medium"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>No credit card required</span>
          </div>
          <span className="hidden sm:inline text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Free forever for small teams</span>
          </div>
          <span className="hidden sm:inline text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-violet-400" />
            <span>Instant setup in under 60s</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
