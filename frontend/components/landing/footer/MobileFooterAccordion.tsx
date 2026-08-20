"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { footerColumns } from "./footerData";

export function MobileFooterAccordion() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <div className="space-y-2 divide-y divide-white/[0.06]">
      {footerColumns.map((col) => {
        const isOpen = !!openSections[col.title];

        return (
          <div key={col.title} className="pt-3">
            <button
              onClick={() => toggleSection(col.title)}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-white uppercase tracking-wider font-display focus:outline-none"
            >
              <span>{col.title}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-violet-400" : ""
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-2.5 py-2 pl-2 text-xs">
                    {col.links.map((link) => {
                      const isAnchor = link.href.startsWith("#");
                      const isExternal = link.isExternal || link.href.startsWith("mailto:");

                      const linkContent = (
                        <span className="flex items-center justify-between py-1 text-slate-400 hover:text-white transition-colors">
                          <span className="flex items-center gap-2">
                            <span>{link.label}</span>
                            {link.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                  link.badge === "AI"
                                    ? "bg-violet-500 text-white"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                }`}
                              >
                                {link.badge}
                              </span>
                            )}
                          </span>
                          {isExternal && <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />}
                        </span>
                      );

                      if (isExternal || isAnchor) {
                        return (
                          <li key={link.label}>
                            <a
                              href={link.href}
                              target={isExternal && !link.href.startsWith("mailto:") ? "_blank" : undefined}
                              rel={isExternal ? "noopener noreferrer" : undefined}
                            >
                              {linkContent}
                            </a>
                          </li>
                        );
                      }

                      return (
                        <li key={link.label}>
                          <Link href={link.href}>{linkContent}</Link>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
