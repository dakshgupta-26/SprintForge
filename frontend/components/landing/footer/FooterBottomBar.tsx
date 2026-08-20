"use client";

import Link from "next/link";

export function FooterBottomBar() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
      <div>
        © {currentYear} SprintForge. Built for high-velocity software engineering.
      </div>

      <div className="flex items-center gap-6">
        <Link href="/privacy" className="hover:text-slate-300 transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-slate-300 transition-colors">
          Terms of Service
        </Link>
        <a href="mailto:sprintforge@gmail.com" className="hover:text-slate-300 transition-colors">
          Security Inquiries
        </a>
      </div>
    </div>
  );
}
