"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Terminal,
  Globe,
  Phone,
  Mail,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Send,
  MessageSquare,
} from "lucide-react";

export function EngineeringTerminalContact() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      <div className="rounded-3xl bg-[#090d1e] border border-violet-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-6 sm:p-10 relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 mb-8 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-violet-400 font-bold mb-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>SprintForge Command Center</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-display">
              Get in Touch with our Engineering Team
            </h3>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Response Systems Operational</span>
          </div>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Location Card */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/30 transition-colors group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Engineering HQ</div>
                <div className="text-sm font-bold text-white">Pune, Maharashtra</div>
              </div>
            </div>
            <p className="text-xs text-slate-500">Global distributed cloud infrastructure</p>
          </div>

          {/* Phone Card */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/30 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Direct Support Line</div>
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
                  <div className="text-xs text-slate-400">Engineering Inquiries</div>
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
            <p className="text-xs text-slate-500">Average response latency &lt; 2 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
}
