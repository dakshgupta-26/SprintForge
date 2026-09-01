"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  FolderKanban,
  Users,
  MessageSquare,
  Layers,
  Zap,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkspaceSignalProps {
  className?: string;
  activeStageIndex?: number;
  status?: "loading" | "ready" | "error";
  compact?: boolean;
}

interface SatelliteNode {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  x: number;
  y: number;
  stageIndex: number;
  color: string;
}

const NODES: SatelliteNode[] = [
  {
    id: "project",
    label: "Project",
    icon: FolderKanban,
    x: 60,
    y: 42,
    stageIndex: 0,
    color: "#8b5cf6", // Violet
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
    x: 300,
    y: 42,
    stageIndex: 1,
    color: "#06b6d4", // Cyan
  },
  {
    id: "chat",
    label: "Chat",
    icon: MessageSquare,
    x: 52,
    y: 158,
    stageIndex: 2,
    color: "#a78bfa", // Light violet
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: Layers,
    x: 308,
    y: 158,
    stageIndex: 3,
    color: "#38bdf8", // Sky blue
  },
  {
    id: "realtime",
    label: "Realtime",
    icon: Zap,
    x: 180,
    y: 194,
    stageIndex: 0,
    color: "#ec4899", // Pink/Rose accent
  },
];

export function WorkspaceSignal({
  className,
  activeStageIndex = 0,
  status = "loading",
  compact = false,
}: WorkspaceSignalProps) {
  const shouldReduceMotion = useReducedMotion();
  const centerX = 180;
  const centerY = 100;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center select-none",
        compact ? "w-[280px] h-[160px]" : "w-[360px] h-[210px]",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 360 210"
        className="w-full h-full overflow-visible drop-shadow-[0_0_20px_rgba(124,92,255,0.15)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Central Radial Gradient */}
          <radialGradient
            id="centerGlow"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Line Gradients */}
          {NODES.map((node) => (
            <linearGradient
              key={`grad-${node.id}`}
              id={`grad-${node.id}`}
              x1={centerX}
              y1={centerY}
              x2={node.x}
              y2={node.y}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.7" />
              <stop
                offset="100%"
                stopColor={node.color}
                stopOpacity={activeStageIndex >= node.stageIndex ? "0.9" : "0.25"}
              />
            </linearGradient>
          ))}

          {/* Flowing Pulse Filter */}
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ─── Ambient Glow in Center ─── */}
        <circle cx={centerX} cy={centerY} r="68" fill="url(#centerGlow)" />

        {/* ─── Connecting Lines & Flowing Beziers ─── */}
        {NODES.map((node, i) => {
          const isNodeActive = activeStageIndex >= node.stageIndex;
          const isCurrentActive = activeStageIndex === node.stageIndex;

          // Compute smooth curved path
          const midX = (centerX + node.x) / 2;
          const midY = (centerY + node.y) / 2 + (node.y > centerY ? 6 : -6);
          const pathD = `M ${centerX} ${centerY} Q ${midX} ${midY} ${node.x} ${node.y}`;

          return (
            <g key={`path-group-${node.id}`}>
              {/* Background guide path */}
              <path
                d={pathD}
                stroke={isNodeActive ? `url(#grad-${node.id})` : "rgba(255, 255, 255, 0.08)"}
                strokeWidth={isCurrentActive ? "1.75" : "1.25"}
                strokeDasharray={isNodeActive ? "none" : "3 3"}
                strokeOpacity={isNodeActive ? 0.7 : 0.25}
                className="transition-all duration-500"
              />

              {/* Animated Light Flow along active lines */}
              {!shouldReduceMotion && status === "loading" && isNodeActive && (
                <motion.circle
                  r={isCurrentActive ? "2.2" : "1.7"}
                  fill="#ffffff"
                  filter="url(#glowFilter)"
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  transition={{
                    duration: 2.2 + i * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.4,
                  }}
                  style={{
                    offsetPath: `path("${pathD}")`,
                  }}
                />
              )}
            </g>
          );
        })}

        {/* ─── Satellite Node Glyphs (Rendered as SVG circles/borders) ─── */}
        {NODES.map((node) => {
          const isNodeActive = activeStageIndex >= node.stageIndex;
          const isCurrentActive = activeStageIndex === node.stageIndex;
          const Icon = node.icon;

          return (
            <g key={`node-group-${node.id}`}>
              {/* Node Outer Halo on Current Active */}
              {isCurrentActive && !shouldReduceMotion && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r="18"
                  fill="none"
                  stroke={node.color}
                  strokeWidth="1"
                  strokeOpacity="0.4"
                  initial={{ scale: 0.85, opacity: 0.2 }}
                  animate={{ scale: [0.95, 1.25, 0.95], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Node Background Base */}
              <circle
                cx={node.x}
                cy={node.y}
                r="13"
                fill={isNodeActive ? "#0d1326" : "#070a14"}
                stroke={isNodeActive ? node.color : "rgba(255, 255, 255, 0.12)"}
                strokeWidth={isNodeActive ? "1.5" : "1"}
                strokeOpacity={isNodeActive ? "0.8" : "0.3"}
                className="transition-colors duration-500"
              />

              {/* Embedded Small Icon via foreignObject */}
              <foreignObject
                x={node.x - 7}
                y={node.y - 7}
                width="14"
                height="14"
                className="pointer-events-none"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <Icon
                    className={cn(
                      "w-3 h-3 transition-all duration-300",
                      isNodeActive ? "text-white" : "text-slate-600"
                    )}
                  />
                </div>
              </foreignObject>

              {/* Node Label Text */}
              <text
                x={node.x}
                y={node.y + (node.y > centerY ? 22 : -18)}
                textAnchor="middle"
                fontSize="9"
                fontFamily="var(--font-mono, monospace)"
                fontWeight={isCurrentActive ? "600" : "500"}
                letterSpacing="0.05em"
                fill={
                  isCurrentActive
                    ? "#e2e8f0"
                    : isNodeActive
                    ? "#94a3b8"
                    : "#475569"
                }
                className="transition-all duration-300"
              >
                {node.label.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* ─── Central SprintForge Workspace Hub Node ─── */}
        <g>
          {/* Animated Ambient Pulse Rings */}
          {!shouldReduceMotion && status === "loading" && (
            <>
              <motion.circle
                cx={centerX}
                cy={centerY}
                r="28"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1"
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: [0.85, 1.4, 0.85], opacity: [0.5, 0.05, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.circle
                cx={centerX}
                cy={centerY}
                r="36"
                fill="none"
                stroke="#6366f1"
                strokeWidth="0.75"
                strokeDasharray="4 4"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                style={{ originX: "180px", originY: "100px" }}
              />
            </>
          )}

          {/* Central Hex/Circle Body */}
          <circle
            cx={centerX}
            cy={centerY}
            r="20"
            fill="#090d1c"
            stroke="url(#grad-project)"
            strokeWidth="2"
            className="drop-shadow-[0_0_14px_rgba(139,92,246,0.5)]"
          />

          {/* Inner Glowing Center */}
          <circle
            cx={centerX}
            cy={centerY}
            r="11"
            fill="linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)"
            fillOpacity="0.4"
          />

          {/* Sparkle/Logo Central Indicator */}
          <foreignObject
            x={centerX - 9}
            y={centerY - 9}
            width="18"
            height="18"
            className="pointer-events-none"
          >
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-violet-300 drop-shadow-[0_0_6px_rgba(167,139,250,0.8)] animate-pulse" />
            </div>
          </foreignObject>
        </g>
      </svg>
    </div>
  );
}
