"use client";

import Link from "next/link";
import { SprintForgeLogo } from "@/components/shared/SprintForgeLogo";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#05070d] text-slate-400 pt-16 pb-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/[0.06]">
          {/* Brand Col (2 cols on md) */}
          <div className="col-span-2 space-y-4">
            <SprintForgeLogo href="/" size="md" />
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              The modern Agile project management platform for high-velocity software teams. Plan sprints, automate velocity insights, and ship with confidence.
            </p>

            {/* Operational Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Systems Operational (99.99%)</span>
            </div>
          </div>

          {/* Col 1: Product */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider font-display">Product</div>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Scrum Boards</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Kanban Flow</a></li>
              <li><a href="#ai-advantage" className="hover:text-white transition-colors">AI Sprint Copilot</a></li>
              <li><a href="#interactive-demo" className="hover:text-white transition-colors">Interactive Demo</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Encrypted Team Chat</a></li>
            </ul>
          </div>

          {/* Col 2: Company & Story */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider font-display">Company</div>
            <ul className="space-y-2 text-xs">
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">Pune Engineering HQ</a></li>
              <li><a href="mailto:sprintforge@gmail.com" className="hover:text-white transition-colors">Contact Support</a></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Workspace Sign In</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Get Started Free</Link></li>
            </ul>
          </div>

          {/* Col 3: Legal & Security */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider font-display">Legal & Trust</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><a href="#about" className="hover:text-white transition-colors">SOC-2 Compliance</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">End-to-End Encryption</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} SprintForge. Built for high-velocity software engineering.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <a href="mailto:sprintforge@gmail.com" className="hover:text-slate-400 transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
