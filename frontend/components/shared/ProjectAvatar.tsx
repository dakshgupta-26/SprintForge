"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface ProjectAvatarProps {
  project?: {
    name?: string;
    key?: string;
    color?: string;
    imageUrl?: string;
  } | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  shape?: "square" | "rounded";
}

const SIZE_MAP = {
  xs: {
    container: "w-4 h-4 text-[9px] rounded-md",
    img: "w-4 h-4 rounded-md",
  },
  sm: {
    container: "w-5 h-5 text-[10px] rounded-lg",
    img: "w-5 h-5 rounded-lg",
  },
  md: {
    container: "w-7 h-7 text-xs rounded-xl",
    img: "w-7 h-7 rounded-xl",
  },
  lg: {
    container: "w-9 h-9 text-sm rounded-xl",
    img: "w-9 h-9 rounded-xl",
  },
  xl: {
    container: "w-12 h-12 text-base rounded-2xl",
    img: "w-12 h-12 rounded-2xl",
  },
  "2xl": {
    container: "w-20 h-20 text-2xl rounded-3xl",
    img: "w-20 h-20 rounded-3xl",
  },
};

export function ProjectAvatar({
  project,
  size = "md",
  className,
  shape = "rounded",
}: ProjectAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const initial =
    project?.key?.charAt(0) ||
    project?.name?.charAt(0) ||
    "P";

  const color = project?.color || "#6366f1";
  const hasCustomImage = Boolean(project?.imageUrl && !imageError);

  const roundedClass = shape === "square" ? "rounded-none" : "";

  if (hasCustomImage && project?.imageUrl) {
    return (
      <div
        className={cn(
          "relative overflow-hidden flex-shrink-0 ring-1 ring-white/10 shadow-sm bg-[#060914] flex items-center justify-center",
          sizeConfig.container,
          roundedClass,
          className
        )}
      >
        <img
          src={project.imageUrl}
          alt={project.name || "Project Avatar"}
          onError={() => setImageError(true)}
          className={cn(
            "w-full h-full object-cover object-center select-none",
            roundedClass
          )}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center font-mono font-bold text-white shadow-sm flex-shrink-0 select-none ring-1 ring-white/10",
        sizeConfig.container,
        roundedClass,
        className
      )}
      style={{ backgroundColor: color }}
      title={project?.name || "Project"}
    >
      <span>{initial.toUpperCase()}</span>
    </div>
  );
}
