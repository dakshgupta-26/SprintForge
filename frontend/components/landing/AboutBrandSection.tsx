"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Phone,
  Mail,
  Zap,
  Cpu,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  ArrowUpRight,
  Compass,
  Code2,
} from "lucide-react";

export function AboutBrandSection() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <section id="about" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#060811]/70 border-t border-white/[0.06]">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-violet-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* Main Heading & Mission */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Compass className="w-3 h-3" /> Our Philosophy
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display mb-6">
            Built for teams that <br />
            <span className="gradient-text">build the future.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            SprintForge was created with a single obsession: to eliminate the bureaucratic drag from modern software development. We believe project management should empower developers, not slow them down.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: Zap,
              title: "Obsessive Speed",
              desc: "Engineered with sub-15ms Socket.IO synchronization, instant optimistic UI updates, and keyboard-first agility.",
              gradient: "from-violet-500/20 to-indigo-500/20 text-violet-300 border-violet-500/30",
            },
            {
              icon: Cpu,
              title: "Autonomous Intelligence",
              desc: "Deterministic AI models analyze cycle times, forecast velocity, and mitigate blockers before meetings are needed.",
              gradient: "from-indigo-500/20 to-blue-500/20 text-indigo-300 border-indigo-500/30",
            },
            {
              icon: ShieldCheck,
              title: "Enterprise Governance",
              desc: "Granular role-based access control, end-to-end encrypted chat threads, and rock-solid workspace security.",
              gradient: "from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30",
            },
          ].map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 sm:p-8 rounded-3xl bg-[#090d19]/80 border border-white/[0.08] hover:border-violet-500/30 transition-all duration-300 space-y-4"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pillar.gradient} border flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white font-display">{pillar.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{pillar.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Modern Contact & Location Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-8 sm:p-10 rounded-3xl bg-[#0a0f1e] border border-violet-500/30 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 mb-8 border-b border-white/[0.08]">
            <div>
              <span className="text-xs uppercase tracking-widest text-violet-400 font-bold">Connect With SprintForge</span>
              <h3 className="text-2xl font-black text-white font-display mt-1">Get in Touch with our Engineering Team</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Have questions about self-hosting, enterprise security, or workspace migrations? Reach out directly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Location Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Headquarters</div>
                  <div className="text-sm font-bold text-white">Pune, Maharashtra</div>
                </div>
              </div>
              <p className="text-xs text-slate-500">Global distributed engineering infrastructure</p>
            </div>

            {/* Phone Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/30 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Direct Contact</div>
                    <a href="tel:+917780935163" className="text-sm font-bold text-white hover:text-violet-300 transition-colors">
                      +91 7780935163
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard("+91 7780935163", "phone")}
                  className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                  title="Copy Phone Number"
                >
                  {copiedField === "phone" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">Monday–Friday, 9:00 AM – 7:00 PM IST</p>
            </div>

            {/* Email Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/30 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Inquiries & Support</div>
                    <a href="mailto:sprintforge@gmail.com" className="text-sm font-bold text-violet-400 hover:underline">
                      sprintforge@gmail.com
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard("sprintforge@gmail.com", "email")}
                  className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                  title="Copy Email Address"
                >
                  {copiedField === "email" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">Average response time: &lt; 2 hours</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
