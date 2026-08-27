"use client";

import React, { useState } from "react";
import { getAvatarUrl, generateAvatar, cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  ringClassName?: string;
  showOnline?: boolean;
  alt?: string;
}

const sizeMap = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
  xl: "w-16 h-16 text-lg",
  "2xl": "w-24 h-24 text-2xl",
};

export function UserAvatar({
  src,
  name = "User",
  size = "md",
  className,
  ringClassName,
  showOnline = false,
  alt,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const resolvedSrc = hasError
    ? generateAvatar(name)
    : getAvatarUrl(src, name);

  return (
    <div className={cn("relative inline-flex items-center justify-center flex-shrink-0", sizeMap[size], className)}>
      <img
        src={resolvedSrc}
        alt={alt || `${name}'s profile photo`}
        onError={() => setHasError(true)}
        className={cn(
          "w-full h-full rounded-full object-cover bg-[#090d20]",
          ringClassName
        )}
      />
      {showOnline && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070b1a]" />
      )}
    </div>
  );
}
