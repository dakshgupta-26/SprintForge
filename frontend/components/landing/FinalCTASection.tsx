"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function FinalCTASection() {
  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Radiant Background Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-purple-600/20 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl bg-gradient-to-b from-[#0e1428] to-[#070a14] border border-violet-500/40 p-8 sm:p-16 text-center shadow-[0_25px_80px_rgba(124,92,255,0.2)] overflow-hidden"
        >
          {/* Subtle Corner Highlights */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
          <div className="absolute inset-0 bg-grid-faint opacity-40 pointer-events-none" />

          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Join 10,000+ engineers shipping with SprintForge</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight font-display mb-6 leading-tight">
            Ready to ship better <br />
            <span className="gradient-text">software, faster?</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Bring your team, projects, chat, and momentum into one intelligent workspace. Start free today with no setup overhead.
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/signup"
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-bold text-white rounded-xl btn-primary-glow"
            >
              <span>Start building for free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-semibold text-slate-200 rounded-xl btn-secondary-glass"
            >
              Sign in to Workspace
            </Link>
          </div>

          {/* Reassurances */}
          <div className="flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Free forever tier for small teams</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instant single-click workspace setup</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
