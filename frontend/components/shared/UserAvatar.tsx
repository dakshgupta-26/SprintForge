"use client";

import React, { useState, useEffect } from "react";
import { getAvatarUrl, getInitials, getAvatarGradient, cn } from "@/lib/utils";

export interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  ringClassName?: string;
  shape?: "circle" | "rounded" | "rounded-xl" | "rounded-2xl";
  showOnline?: boolean;
  isOnline?: boolean;
  alt?: string;
}

const sizeMap = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-7 h-7 text-xs font-semibold",
  md: "w-8 h-8 text-xs font-bold",
  lg: "w-10 h-10 text-sm font-bold",
  xl: "w-14 h-14 sm:w-16 sm:h-16 text-base sm:text-lg font-extrabold",
  "2xl": "w-20 h-20 sm:w-24 sm:h-24 text-xl sm:text-2xl font-black",
};

const shapeMap = {
  circle: "rounded-full",
  rounded: "rounded-lg",
  "rounded-xl": "rounded-xl",
  "rounded-2xl": "rounded-2xl",
};

export function UserAvatar({
  src,
  name = "User",
  size = "md",
  className,
  ringClassName,
  shape = "circle",
  showOnline = false,
  isOnline = true,
  alt,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const resolvedSrc = getAvatarUrl(src, name);
  const initials = getInitials(name);
  const gradient = getAvatarGradient(name);
  const roundedClass = shapeMap[shape] || "rounded-full";

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center flex-shrink-0 select-none",
        sizeMap[size] || sizeMap.md,
        className
      )}
    >
      {resolvedSrc && !hasError ? (
        <img
          src={resolvedSrc}
          alt={alt || `${name}'s avatar`}
          onError={() => setHasError(true)}
          className={cn(
            "w-full h-full object-cover bg-[#090d20]",
            roundedClass,
            ringClassName
          )}
        />
      ) : (
        <div
          className={cn(
            "w-full h-full flex items-center justify-center text-white bg-gradient-to-br shadow-inner uppercase tracking-wider",
            gradient,
            roundedClass,
            ringClassName
          )}
          title={name}
        >
          <span>{initials}</span>
        </div>
      )}

      {showOnline && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-[#070b1a] transition-colors",
            size === "xs" ? "w-1.5 h-1.5" : size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5",
            isOnline ? "bg-emerald-500 shadow-[0_0_6px_#10b981]" : "bg-slate-600"
          )}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
