"use client";

import { motion } from "framer-motion";
import { FooterBrandCol } from "./footer/FooterBrandCol";
import { FooterColumn } from "./footer/FooterColumn";
import { MobileFooterAccordion } from "./footer/MobileFooterAccordion";
import { FooterBottomBar } from "./footer/FooterBottomBar";
import { footerColumns } from "./footer/footerData";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#05070d] text-slate-400 pt-16 sm:pt-20 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Engineering ambient grid background */}
      <div className="absolute inset-0 bg-grid-faint opacity-30 pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Desktop Layout (md and up) */}
        <div className="hidden md:grid md:grid-cols-6 gap-8 lg:gap-10 pb-12 border-b border-white/[0.06]">
          {/* Brand Column (2 cols) */}
          <div className="md:col-span-2">
            <FooterBrandCol />
          </div>

          {/* 4 Navigation Columns (1 col each) */}
          {footerColumns.map((col) => (
            <div key={col.title} className="md:col-span-1">
              <FooterColumn column={col} />
            </div>
          ))}
        </div>

        {/* Mobile Layout (below md) */}
        <div className="md:hidden space-y-8 pb-10 border-b border-white/[0.06]">
          <FooterBrandCol />
          <MobileFooterAccordion />
        </div>

        {/* Bottom Bar */}
        <FooterBottomBar />
      </div>
    </footer>
  );
}
