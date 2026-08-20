"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2, Play, ShieldCheck, Zap } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function FooterCTA() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLAnchorElement>(null);

  // Subtle magnetic hover effect on desktop (max 4px)
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setMagneticOffset({ x: x * 0.12, y: y * 0.12 });
  };

  const handleMouseLeave = () => {
    setMagneticOffset({ x: 0, y: 0 });
  };

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Atmospheric Background Radiance */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[450px] bg-gradient-to-r from-violet-600/15 via-indigo-600/15 to-purple-600/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl bg-gradient-to-b from-[#0d1326]/90 to-[#070a14]/95 border border-violet-500/30 p-8 sm:p-14 lg:p-16 text-center shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden"
        >
          {/* Subtle animated light sweep */}
          {!prefersReducedMotion && (
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-violet-500/[0.07] to-transparent rotate-45 pointer-events-none animate-[shimmer_10s_infinite]" />
          )}

          {/* Top border ambient highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
          <div className="absolute inset-0 bg-grid-faint opacity-40 pointer-events-none" />

          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Built for High-Velocity Teams</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight font-display mb-5 leading-[1.1]">
            Build better software. <br />
            <span className="gradient-text">Together.</span>
          </h2>

          {/* Concise Copy */}
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed mb-10 font-normal">
            Plan smarter, collaborate in real time, and ship with total confidence using SprintForge.
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              ref={buttonRef}
              href="/signup"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: !prefersReducedMotion
                  ? `translate(${magneticOffset.x}px, ${magneticOffset.y}px)`
                  : "none",
                transition: "transform 0.15s ease-out",
              }}
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm sm:text-base font-bold text-white rounded-xl btn-primary-glow shadow-lg shadow-violet-600/30"
            >
              <span>Start building for free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>

            <a
              href="#interactive-demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm sm:text-base font-semibold text-slate-200 rounded-xl btn-secondary-glass"
            >
              <Play className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
              <span>Explore live workspace</span>
            </a>
          </div>

          {/* Infrastructure Status Indicator & Reassurances */}
          <div className="flex flex-wrap items-center justify-center gap-y-3 gap-x-6 text-xs text-slate-400 pt-4 border-t border-white/[0.06]">
            {/* System Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Systems Operational (99.99%)</span>
            </div>

            <span className="hidden sm:inline text-slate-700">•</span>

            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>No credit card required</span>
            </div>

            <span className="hidden sm:inline text-slate-700">•</span>

            <div className="flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Free forever for small teams</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
