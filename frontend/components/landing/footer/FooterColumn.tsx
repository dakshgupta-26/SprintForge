"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FooterColumnDef } from "./footerData";

interface FooterColumnProps {
  column: FooterColumnDef;
}

export function FooterColumn({ column }: FooterColumnProps) {
  return (
    <div className="space-y-3.5">
      <div className="text-xs font-bold text-white uppercase tracking-wider font-display">
        {column.title}
      </div>

      <ul className="space-y-2.5 text-xs">
        {column.links.map((link) => {
          const isAnchor = link.href.startsWith("#");
          const isExternal = link.isExternal || link.href.startsWith("mailto:");

          const linkContent = (
            <span className="group flex items-center justify-between py-0.5 text-slate-400 hover:text-white transition-all duration-200 cursor-pointer">
              <span className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform duration-200">
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

              {isExternal && (
                <ArrowUpRight className="w-3 h-3 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all opacity-0 group-hover:opacity-100" />
              )}
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
    </div>
  );
}
