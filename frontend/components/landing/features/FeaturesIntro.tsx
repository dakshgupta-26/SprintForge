"use client";

import { motion } from "framer-motion";
import { Sparkles, Layers, Zap } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function FeaturesIntro() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-24 relative">
      {/* Subtle expanding ambient glow behind intro */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[300px] bg-gradient-to-r from-violet-600/15 via-indigo-600/10 to-purple-600/15 blur-[120px] rounded-full pointer-events-none -z-10"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="space-y-5"
      >
        {/* Eyebrow Pill */}
        <motion.div variants={itemVariants} className="inline-flex items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-[0_0_20px_rgba(124,92,255,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Core Capabilities</span>
          </div>
        </motion.div>

        {/* Cinematic Main Heading */}
        <motion.h2
          variants={itemVariants}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-[68px] font-black text-white tracking-tight leading-[1.08] font-display"
        >
          Everything your team needs <br className="hidden sm:inline" />
          <span className="gradient-text">to ship better software.</span>
        </motion.h2>

        {/* Supporting Copy */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal"
        >
          One intelligent workspace for planning, building, collaborating, and shipping without the bureaucratic overhead.
        </motion.p>
      </motion.div>
    </div>
  );
}
