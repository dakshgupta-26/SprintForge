"use client";

import { motion } from "framer-motion";
import { Layers, Shield, Cpu, Zap, Globe, Orbit, Box, Terminal } from "lucide-react";

const logos = [
  { name: "NOVA", icon: Orbit, sub: "AI Robotics" },
  { name: "STACKLAB", icon: Layers, sub: "Cloud Infrastructure" },
  { name: "ORBIT", icon: Globe, sub: "Distributed Systems" },
  { name: "NEXUS", icon: Cpu, sub: "Edge Compute" },
  { name: "CLOUDCORE", icon: Box, sub: "DevOps Platform" },
  { name: "HYPERION", icon: Zap, sub: "Real-time Fintech" },
  { name: "SYNAPSE", icon: Terminal, sub: "Autonomous Agents" },
];

export function LogoCloud() {
  return (
    <section className="py-16 sm:py-20 border-y border-white/[0.06] bg-[#060811]/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-8"
        >
          Trusted by forward-thinking engineering teams & high-velocity startups
        </motion.p>

        {/* Logo Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6 items-center justify-center"
        >
          {logos.map((logo) => {
            const Icon = logo.icon;
            return (
              <div
                key={logo.name}
                className="group flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-violet-500/30 hover:bg-violet-950/20 transition-all duration-300 cursor-default"
              >
                <div className="flex items-center gap-2 text-slate-400 group-hover:text-violet-300 transition-colors">
                  <Icon className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  <span className="font-extrabold tracking-wider text-xs font-display">
                    {logo.name}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors mt-0.5 font-medium">
                  {logo.sub}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
