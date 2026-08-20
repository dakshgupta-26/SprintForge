"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  GripVertical,
  Plus,
  Play,
  RotateCcw,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface KanbanCard {
  id: string;
  key: string;
  title: string;
  tag: string;
  tagColor: string;
  points: number;
  priority: "critical" | "high" | "medium";
  assignee: { name: string; avatar: string; color: string };
  columnId: "backlog" | "in_progress" | "review" | "done";
}

const initialCards: KanbanCard[] = [
  {
    id: "k1",
    key: "SFG-124",
    title: "Build Authentication & OAuth One-Tap",
    tag: "Auth",
    tagColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    points: 5,
    priority: "high",
    assignee: { name: "Alex Rivera", avatar: "AR", color: "bg-indigo-600" },
    columnId: "in_progress",
  },
  {
    id: "k2",
    key: "SFG-125",
    title: "API Gateway Token Rate Limiting",
    tag: "Backend",
    tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    points: 5,
    priority: "medium",
    assignee: { name: "David Chen", avatar: "DC", color: "bg-blue-600" },
    columnId: "backlog",
  },
  {
    id: "k3",
    key: "SFG-126",
    title: "Fix API GraphQL Batch Performance",
    tag: "Performance",
    tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    points: 3,
    priority: "high",
    assignee: { name: "Sarah Lin", avatar: "SL", color: "bg-violet-600" },
    columnId: "review",
  },
  {
    id: "k4",
    key: "SFG-128",
    title: "Real-time Multiplayer Presence Sync",
    tag: "Socket.IO",
    tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    points: 8,
    priority: "critical",
    assignee: { name: "Marcus Vance", avatar: "MV", color: "bg-teal-600" },
    columnId: "done",
  },
];

const columns = [
  { id: "backlog", name: "Backlog", color: "bg-slate-500", glow: "border-slate-500/30" },
  { id: "in_progress", name: "In Progress", color: "bg-indigo-500", glow: "border-indigo-500/40" },
  { id: "review", name: "Review", color: "bg-amber-500", glow: "border-amber-500/40" },
  { id: "done", name: "Done", color: "bg-emerald-500", glow: "border-emerald-500/40" },
] as const;

export function KanbanInteractiveChapter() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [cards, setCards] = useState<KanbanCard[]>(initialCards);
  const [activeWorkflowStage, setActiveWorkflowStage] = useState<number>(0);
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  // Advance SFG-124 through workflow
  const advanceSFG124 = () => {
    const nextStage = (activeWorkflowStage + 1) % 4;
    setActiveWorkflowStage(nextStage);

    const targetCol: "backlog" | "in_progress" | "review" | "done" =
      nextStage === 0 ? "backlog" : nextStage === 1 ? "in_progress" : nextStage === 2 ? "review" : "done";

    setCards((prev) =>
      prev.map((c) => (c.key === "SFG-124" ? { ...c, columnId: targetCol } : c))
    );
  };

  const resetBoard = () => {
    setActiveWorkflowStage(1);
    setCards(initialCards);
  };

  const moveCardTo = (cardId: string, colId: "backlog" | "in_progress" | "review" | "done") => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, columnId: colId } : c))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Chapter Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <FolderKanban className="w-3.5 h-3.5 text-blue-400" /> Chapter 02 · Execution
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight font-display">
            High-Speed Kanban & Scrum Engine
          </h3>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Zero-lag task updates, instant keyboard controls, and real-time state broadcasts. Test the live workflow progression or drag tickets across columns.
          </p>
        </motion.div>

        {/* Interactive Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2.5 shrink-0"
        >
          <button
            onClick={advanceSFG124}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Simulate SFG-124 Flow →</span>
          </button>
          <button
            onClick={resetBoard}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
            title="Reset Board"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Interactive Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colCards = cards.filter((c) => c.columnId === col.id);
          const isTargeted = draggedOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDraggedOverCol(col.id);
              }}
              onDragLeave={() => setDraggedOverCol(null)}
              onDrop={(e) => {
                e.preventDefault();
                const cardId = e.dataTransfer.getData("text/plain");
                if (cardId) moveCardTo(cardId, col.id);
                setDraggedOverCol(null);
              }}
              className={`flex flex-col bg-[#070a16]/90 border rounded-2xl p-3.5 min-h-[380px] transition-all duration-200 ${
                isTargeted
                  ? `border-violet-500 bg-violet-950/20 shadow-[0_0_30px_rgba(124,92,255,0.2)]`
                  : `border-white/[0.07]`
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1 pb-2 border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {col.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-full">
                  {colCards.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 flex-1">
                <AnimatePresence>
                  {colCards.map((card) => {
                    const isSFG124 = card.key === "SFG-124";

                    return (
                      <motion.div
                        key={card.id}
                        layout
                        layoutId={card.id}
                        draggable
                        onDragStart={(e: any) => {
                          e.dataTransfer.setData("text/plain", card.id);
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className={`p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing group ${
                          isSFG124
                            ? "bg-violet-950/40 border-violet-500/50 shadow-[0_4px_25px_rgba(124,92,255,0.2)] ring-1 ring-violet-500/30"
                            : "bg-[#0c1224] border-white/[0.08] hover:border-white/[0.2] hover:bg-[#101730]"
                        }`}
                      >
                        {/* Top Bar */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                            <span className="font-mono text-[10px] font-bold text-slate-300">
                              {card.key}
                            </span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${card.tagColor}`}>
                              {card.tag}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-400 bg-white/[0.04] px-1.5 py-0.2 rounded">
                            {card.points} SP
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className={`text-xs font-semibold mb-3 leading-snug ${card.columnId === "done" ? "line-through text-slate-300" : "text-white"}`}>
                          {card.title}
                        </h4>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-4 h-4 rounded-full ${card.assignee.color} flex items-center justify-center text-[8px] font-bold text-white`}>
                              {card.assignee.avatar}
                            </div>
                            <span>{card.assignee.name}</span>
                          </div>

                          {card.columnId === "done" ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          ) : card.columnId === "review" ? (
                            <span className="text-amber-400 font-bold">In Review</span>
                          ) : card.columnId === "in_progress" ? (
                            <span className="text-indigo-400 font-bold">Active</span>
                          ) : (
                            <span className="text-slate-500">Queued</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Column Quick Action */}
              <button
                onClick={() => {
                  const newCard: KanbanCard = {
                    id: `k-${Date.now()}`,
                    key: `SFG-${Math.floor(130 + Math.random() * 20)}`,
                    title: "Automated test suite validation",
                    tag: "Testing",
                    tagColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
                    points: 3,
                    priority: "medium",
                    assignee: { name: "Priya Sharma", avatar: "PS", color: "bg-emerald-600" },
                    columnId: col.id,
                  };
                  setCards((prev) => [...prev, newCard]);
                }}
                className="mt-3 w-full py-1.5 rounded-lg border border-dashed border-white/[0.08] hover:border-violet-500/40 hover:bg-white/[0.02] text-[11px] text-slate-500 hover:text-violet-300 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3 h-3" /> Add Card
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
