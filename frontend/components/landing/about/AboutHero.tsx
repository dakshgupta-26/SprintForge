"use client";

import { motion } from "framer-motion";
import { Compass, Sparkles } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function AboutHero() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.15,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <div className="text-center max-w-5xl mx-auto mb-20 sm:mb-28 relative">
      {/* Subtle radial violet atmosphere behind the heading */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[850px] h-[380px] bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-indigo-600/10 blur-[140px] rounded-full pointer-events-none -z-10"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="space-y-6"
      >
        {/* Eyebrow */}
        <motion.div variants={itemVariants} className="inline-flex items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-[0_0_20px_rgba(124,92,255,0.12)]">
            <Compass className="w-3.5 h-3.5 text-violet-400" />
            <span>Our Philosophy</span>
          </div>
        </motion.div>

        {/* Large Grotesk Typography */}
        <motion.h2
          variants={itemVariants}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-black text-white tracking-[-0.04em] leading-[0.98] font-display"
        >
          Built for teams <br />
          <span className="gradient-text">that build the future.</span>
        </motion.h2>

        {/* Concise Description */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal"
        >
          SprintForge was created with a single obsession: to eliminate the bureaucratic drag from modern software development. We believe project management should empower developers, not slow them down.
        </motion.p>
      </motion.div>
    </div>
  );
}
