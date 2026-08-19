"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SprintForgeLogoProps {
  className?: string;
  variant?: "full" | "icon" | "image-only";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showBadge?: boolean;
  badgeText?: string;
  href?: string;
  priority?: boolean;
}

const sizeConfig = {
  xs: {
    iconSize: 22,
    wrapperClass: "w-6 h-6",
    textClass: "text-sm",
    badgeClass: "text-[9px] px-1.5 py-0.2",
    fullImageWidth: 110,
    fullImageHeight: 30,
  },
  sm: {
    iconSize: 28,
    wrapperClass: "w-7 h-7",
    textClass: "text-base",
    badgeClass: "text-[10px] px-1.5 py-0.5",
    fullImageWidth: 130,
    fullImageHeight: 36,
  },
  md: {
    iconSize: 34,
    wrapperClass: "w-9 h-9",
    textClass: "text-lg",
    badgeClass: "text-[10px] px-2 py-0.5",
    fullImageWidth: 155,
    fullImageHeight: 42,
  },
  lg: {
    iconSize: 42,
    wrapperClass: "w-11 h-11",
    textClass: "text-2xl",
    badgeClass: "text-xs px-2.5 py-0.5",
    fullImageWidth: 190,
    fullImageHeight: 52,
  },
  xl: {
    iconSize: 52,
    wrapperClass: "w-14 h-14",
    textClass: "text-3xl",
    badgeClass: "text-xs px-3 py-1",
    fullImageWidth: 240,
    fullImageHeight: 64,
  },
};

export function SprintForgeLogo({
  className,
  variant = "full",
  size = "md",
  showBadge = false,
  badgeText = "Agile AI",
  href,
  priority = true,
}: SprintForgeLogoProps) {
  const config = sizeConfig[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none group", className)}>
      {/* Glowing 3D Speed Icon */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl p-[1px] bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-600 shadow-[0_0_18px_rgba(124,92,255,0.35)] group-hover:shadow-[0_0_28px_rgba(139,92,246,0.65)] transition-all duration-300 flex-shrink-0 overflow-hidden",
          config.wrapperClass
        )}
      >
        <div className="w-full h-full bg-[#070913] rounded-[10px] flex items-center justify-center overflow-hidden p-0.5">
          <Image
            src="/logo-icon.png"
            alt="SprintForge Icon"
            width={config.iconSize}
            height={config.iconSize}
            className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        </div>
      </div>

      {/* Typography */}
      {variant === "full" && (
        <div className="flex items-center gap-2">
          <span className={cn("font-extrabold tracking-tight text-white font-display", config.textClass)}>
            Sprint<span className="text-violet-400">Forge</span>
          </span>
          {showBadge && (
            <span
              className={cn(
                "hidden sm:inline-flex items-center uppercase font-semibold rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20",
                config.badgeClass
              )}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
