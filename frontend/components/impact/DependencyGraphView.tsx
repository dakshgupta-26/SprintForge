"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Layers,
  Sparkles,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  User,
  GitBranch,
} from "lucide-react";
import { EnrichedTask, DependencyEdge } from "./types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";

interface DependencyGraphViewProps {
  tasks: EnrichedTask[];
  edges: DependencyEdge[];
  criticalPathIds: string[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onSimulateTask: (taskId: string) => void;
}

interface NodeLayoutPosition {
  taskId: string;
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;
const COL_SPACING = 300;
const ROW_SPACING = 130;

export function DependencyGraphView({
  tasks,
  edges,
  criticalPathIds,
  selectedTaskId,
  onSelectTask,
  onSimulateTask,
}: DependencyGraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Map of taskId -> Task object
  const taskMap = useMemo(() => {
    const map = new Map<string, EnrichedTask>();
    tasks.forEach((t) => map.set(t._id, t));
    return map;
  }, [tasks]);

  // Compute Layered Topological Depth for Grid Layout
  const layoutPositions = useMemo(() => {
    const depthMap = new Map<string, number>();

    // Calculate topological depth for each node
    const getDepth = (taskId: string, visited = new Set<string>()): number => {
      if (depthMap.has(taskId)) return depthMap.get(taskId)!;
      if (visited.has(taskId)) return 0; // Avoid cycles

      visited.add(taskId);
      const incomingEdges = edges.filter((e) => e.to === taskId);
      if (incomingEdges.length === 0) {
        depthMap.set(taskId, 0);
        return 0;
      }

      let maxPredDepth = 0;
      for (const e of incomingEdges) {
        maxPredDepth = Math.max(maxPredDepth, getDepth(e.from, new Set(visited)) + 1);
      }

      depthMap.set(taskId, maxPredDepth);
      return maxPredDepth;
    };

    tasks.forEach((t) => getDepth(t._id));

    // Group tasks by column depth
    const columns = new Map<number, string[]>();
    tasks.forEach((t) => {
      const col = depthMap.get(t._id) || 0;
      if (!columns.has(col)) columns.set(col, []);
      columns.get(col)!.push(t._id);
    });

    const positions = new Map<string, NodeLayoutPosition>();

    columns.forEach((taskIdsInCol, colIdx) => {
      taskIdsInCol.forEach((taskId, rowIdx) => {
        positions.set(taskId, {
          taskId,
          column: colIdx,
          row: rowIdx,
          x: colIdx * COL_SPACING + 40,
          y: rowIdx * ROW_SPACING + 40,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        });
      });
    });

    return positions;
  }, [tasks, edges]);

  // Blast Radius of selected node
  const activeBlastRadius = useMemo(() => {
    if (!selectedTaskId) return { downstream: new Set<string>(), upstream: new Set<string>() };

    const downstream = new Set<string>();
    const queue = [selectedTaskId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      edges.filter((e) => e.from === curr).forEach((e) => {
        if (!downstream.has(e.to)) {
          downstream.add(e.to);
          queue.push(e.to);
        }
      });
    }

    const upstream = new Set<string>();
    const upQueue = [selectedTaskId];
    while (upQueue.length > 0) {
      const curr = upQueue.shift()!;
      edges.filter((e) => e.to === curr).forEach((e) => {
        if (!upstream.has(e.from)) {
          upstream.add(e.from);
          upQueue.push(e.from);
        }
      });
    }

    return { downstream, upstream };
  }, [selectedTaskId, edges]);

  // Drag Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".graph-node-card")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.4, Math.min(1.8, Math.round((prev + delta) * 10) / 10)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 40, y: 40 });
  };

  // Selected Task Details
  const selectedTask = selectedTaskId ? taskMap.get(selectedTaskId) : null;

  return (
    <div className="relative w-full h-[620px] rounded-2xl bg-[#04060d] border border-white/[0.08] overflow-hidden select-none">
      {/* ── Background Circuit Dots ── */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          transform: `translate(${pan.x % 24}px, ${pan.y % 24}px)`,
        }}
      />

      {/* ── 1. Top Controls Bar ── */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#090d1f]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/[0.1] shadow-xl">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search task dependency..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] text-white text-xs border border-white/[0.06] focus:outline-none focus:border-violet-500 w-44 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowCriticalOnly(!showCriticalOnly)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              showCriticalOnly
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]"
            )}
          >
            <Zap className="w-3 h-3" />
            <span>Critical Path</span>
          </button>
        </div>

        {/* Right: Zoom & Reset Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#090d1f]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/[0.1] shadow-xl">
          <button
            type="button"
            onClick={() => handleZoom(0.15)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold text-slate-400 px-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => handleZoom(-0.15)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/[0.1] mx-0.5" />
          <button
            type="button"
            onClick={resetView}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2. Interactive SVG Canvas & Nodes ── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          className="relative w-[3000px] h-[2000px]"
        >
          {/* SVG Directed Bezier Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker
                id="arrow-normal"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="rgba(255, 255, 255, 0.25)" />
              </marker>
              <marker
                id="arrow-critical"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
              </marker>
              <marker
                id="arrow-blast"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#06b6d4" />
              </marker>
            </defs>

            {edges.map((edge, idx) => {
              const fromPos = layoutPositions.get(edge.from);
              const toPos = layoutPositions.get(edge.to);
              if (!fromPos || !toPos) return null;

              const isEdgeCritical =
                criticalPathIds.includes(edge.from) && criticalPathIds.includes(edge.to);
              const isEdgeBlast =
                selectedTaskId === edge.from ||
                (activeBlastRadius.downstream.has(edge.from) &&
                  activeBlastRadius.downstream.has(edge.to));

              if (showCriticalOnly && !isEdgeCritical) return null;

              const startX = fromPos.x + NODE_WIDTH;
              const startY = fromPos.y + NODE_HEIGHT / 2;
              const endX = toPos.x;
              const endY = toPos.y + NODE_HEIGHT / 2;

              const dx = endX - startX;
              const controlOffset = Math.max(40, dx * 0.45);

              const pathD = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${
                endX - controlOffset
              } ${endY}, ${endX} ${endY}`;

              return (
                <g key={`${edge.from}-${edge.to}-${idx}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isEdgeCritical
                        ? "#f43f5e"
                        : isEdgeBlast
                        ? "#06b6d4"
                        : "rgba(255, 255, 255, 0.16)"
                    }
                    strokeWidth={isEdgeCritical ? 3 : isEdgeBlast ? 2.5 : 1.5}
                    strokeDasharray={isEdgeCritical ? "6,3" : undefined}
                    markerEnd={
                      isEdgeCritical
                        ? "url(#arrow-critical)"
                        : isEdgeBlast
                        ? "url(#arrow-blast)"
                        : "url(#arrow-normal)"
                    }
                    className="transition-colors duration-200"
                  />
                </g>
              );
            })}
          </svg>

          {/* Task Nodes Grid */}
          {tasks.map((task) => {
            const pos = layoutPositions.get(task._id);
            if (!pos) return null;

            const isCritical = criticalPathIds.includes(task._id);
            const isSelected = selectedTaskId === task._id;
            const isDownstream = activeBlastRadius.downstream.has(task._id);
            const isUpstream = activeBlastRadius.upstream.has(task._id);

            const matchesSearch =
              !searchQuery ||
              task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              task._id.toLowerCase().includes(searchQuery.toLowerCase());

            if (showCriticalOnly && !isCritical) return null;

            return (
              <div
                key={task._id}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                }}
                onClick={() => onSelectTask(isSelected ? null : task._id)}
                className={cn(
                  "graph-node-card group rounded-2xl p-3 cursor-pointer transition-all duration-150 border",
                  "bg-[#070b1a]/95 backdrop-blur-md shadow-lg",
                  isSelected
                    ? "ring-2 ring-cyan-400 border-cyan-400 shadow-cyan-900/40 bg-[#091129]"
                    : isCritical
                    ? "border-rose-500/60 ring-1 ring-rose-500/30 bg-[#120710]/90 hover:border-rose-400"
                    : isDownstream
                    ? "border-cyan-500/60 bg-[#04111d]/90 ring-1 ring-cyan-500/30"
                    : isUpstream
                    ? "border-amber-500/50 bg-[#151004]/80"
                    : "border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.04]",
                  !matchesSearch && "opacity-25"
                )}
              >
                {/* Node Top Header */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[10px] font-bold text-slate-400 truncate">
                      {task.type.toUpperCase()}
                    </span>
                    {isCritical && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[9px] border border-rose-500/30">
                        CRITICAL
                      </span>
                    )}
                  </div>

                  {/* Risk Score Pill */}
                  <div
                    className={cn(
                      "px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border",
                      task.risk.level === "critical"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : task.risk.level === "high"
                        ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                        : task.risk.level === "moderate"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    )}
                    title={`Risk Score: ${task.risk.score}/100`}
                  >
                    {task.risk.score}
                  </div>
                </div>

                {/* Node Title */}
                <p className="text-xs font-semibold text-white line-clamp-1 group-hover:text-violet-300 transition-colors">
                  {task.title}
                </p>

                {/* Node Footer: Assignee & Slack */}
                <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {task.assignees[0] ? (
                      <UserAvatar
                        src={task.assignees[0].avatar}
                        name={task.assignees[0].name}
                        size="xs"
                        className="w-4 h-4 text-[9px]"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className="text-slate-400 truncate text-[10px] max-w-[80px]">
                      {task.assignees[0]?.name || "Unassigned"}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      task.cpm.slack === 0 ? "text-rose-400 font-bold" : "text-slate-400"
                    )}
                  >
                    {task.cpm.slack === 0 ? "0d float" : `${task.cpm.slack}d float`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Selected Node Blast Radius Inspector (Slide-in) ── */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-4 right-4 w-80 rounded-2xl bg-[#070b1a]/95 backdrop-blur-xl border border-white/[0.12] p-4 shadow-2xl z-30"
          >
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/[0.08]">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Task Impact Inspector
                </span>
                <h4 className="text-xs font-bold text-white truncate">{selectedTask.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => onSelectTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-mono">Downstream</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">
                    {selectedTask.blastRadius.downstreamCount} tasks
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-mono">Max Depth</span>
                  <span className="text-sm font-bold text-violet-400 font-mono">
                    {selectedTask.blastRadius.downstreamDepth} levels
                  </span>
                </div>
              </div>

              {/* Reasons */}
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  Primary Risk Factors
                </span>
                <ul className="space-y-1">
                  {selectedTask.risk.reasons.slice(0, 2).map((r, i) => (
                    <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                      <span className="text-violet-400 mt-0.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSimulateTask(selectedTask._id)}
                className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-violet-600/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Changes on This Task</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
