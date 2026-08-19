"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Layers,
  Kanban,
  MessageSquare,
  BarChart3,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Users,
  Zap,
  ArrowUpRight,
  TrendingUp,
  GitBranch,
} from "lucide-react";

interface MockCard {
  id: string;
  key: string;
  title: string;
  tag: string;
  tagColor: string;
  priority: "critical" | "high" | "medium" | "low";
  assignee: { name: string; avatar: string; color: string };
  subtasks: { done: number; total: number };
  commentsCount: number;
}

const mockColumns: { id: string; name: string; count: number; color: string; cards: MockCard[] }[] = [
  {
    id: "backlog",
    name: "Backlog",
    count: 3,
    color: "#64748b",
    cards: [
      {
        id: "c1",
        key: "SFG-142",
        title: "Integrate WebAuthn & Hardware Passkey Authentication",
        tag: "Security",
        tagColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        priority: "high",
        assignee: { name: "David Chen", avatar: "DC", color: "bg-rose-600" },
        subtasks: { done: 0, total: 3 },
        commentsCount: 4,
      },
      {
        id: "c2",
        key: "SFG-145",
        title: "Database index optimization on task search & filtering",
        tag: "Backend",
        tagColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        priority: "medium",
        assignee: { name: "Elena Rostova", avatar: "ER", color: "bg-blue-600" },
        subtasks: { done: 1, total: 4 },
        commentsCount: 2,
      },
    ],
  },
  {
    id: "in_progress",
    name: "In Progress",
    count: 2,
    color: "#6366f1",
    cards: [
      {
        id: "c3",
        key: "SFG-138",
        title: "AI Sprint Velocity & Risk Forecasting Engine",
        tag: "AI Core",
        tagColor: "bg-violet-500/15 text-violet-300 border-violet-500/30",
        priority: "critical",
        assignee: { name: "Sarah Lin", avatar: "SL", color: "bg-violet-600" },
        subtasks: { done: 3, total: 4 },
        commentsCount: 8,
      },
      {
        id: "c4",
        key: "SFG-139",
        title: "Real-time multiplayer cursor & presence sync",
        tag: "Frontend",
        tagColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        priority: "high",
        assignee: { name: "Alex Rivera", avatar: "AR", color: "bg-emerald-600" },
        subtasks: { done: 2, total: 2 },
        commentsCount: 5,
      },
    ],
  },
  {
    id: "in_review",
    name: "Code Review",
    count: 2,
    color: "#f59e0b",
    cards: [
      {
        id: "c5",
        key: "SFG-134",
        title: "Encrypted Socket.IO team channel threads",
        tag: "Realtime",
        tagColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        priority: "high",
        assignee: { name: "Priya Sharma", avatar: "PS", color: "bg-amber-600" },
        subtasks: { done: 4, total: 4 },
        commentsCount: 12,
      },
    ],
  },
  {
    id: "done",
    name: "Completed",
    count: 6,
    color: "#22c55e",
    cards: [
      {
        id: "c6",
        key: "SFG-128",
        title: "Automated burndown calculation & cycle time analytics",
        tag: "Analytics",
        tagColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        priority: "medium",
        assignee: { name: "Marcus Vance", avatar: "MV", color: "bg-teal-600" },
        subtasks: { done: 5, total: 5 },
        commentsCount: 6,
      },
    ],
  },
];

export function HeroDashboardMockup() {
  const [activeTab, setActiveTab] = useState("board");
  const [selectedCardId, setSelectedCardId] = useState<string>("c3");

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
      {/* Outer ambient radiant backdrop */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-violet-600/30 via-indigo-600/20 to-purple-600/30 rounded-3xl blur-2xl opacity-70 pointer-events-none -z-10" />

      {/* Main Glass Dashboard Shell */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl sm:rounded-3xl border border-white/[0.12] bg-[#090d19]/90 shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden"
      >
        {/* Browser Chrome Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#060810]/95 text-slate-400">
          {/* macOS window controls */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/40" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
          </div>

          {/* Browser Address Bar */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full text-xs text-slate-400 max-w-sm sm:max-w-md w-full mx-3 justify-center">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-slate-300 font-mono text-[11px] truncate">
              app.sprintforge.io/workspace/sprint-24
            </span>
          </div>

          {/* Real-time status */}
          <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">14ms Live Sync</span>
          </div>
        </div>

        {/* Product Workspace Inner Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
          {/* Mock Left Navigation Sidebar */}
          <div className="hidden md:flex md:col-span-2 flex-col justify-between p-3 border-r border-white/[0.06] bg-[#070b16]/70">
            <div className="space-y-4">
              {/* Workspace selector */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  SF
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">Acme Core Eng</div>
                  <div className="text-[10px] text-slate-400">Pro Plan · 12 seats</div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-2 py-1">
                  Agile Views
                </div>
                {[
                  { id: "board", label: "Scrum Board", icon: Kanban, active: activeTab === "board" },
                  { id: "timeline", label: "Sprint Timeline", icon: Clock, active: activeTab === "timeline" },
                  { id: "ai", label: "AI Insights", icon: Cpu, active: activeTab === "ai", badge: "AI" },
                  { id: "chat", label: "Encrypted Chat", icon: MessageSquare, active: false, badge: "3" },
                  { id: "analytics", label: "Burndown Rate", icon: BarChart3, active: false },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        item.active
                          ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${item.active ? "text-violet-400" : "text-slate-500"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            item.badge === "AI"
                              ? "bg-violet-500 text-white"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Assistant Mini Status Card */}
            <div className="p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/20 text-left">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-300 mb-1">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>Sprint Health: 94%</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                No blockers detected. Estimated velocity is 15% ahead of target.
              </p>
            </div>
          </div>

          {/* Main Board Content Area */}
          <div className="md:col-span-10 p-4 sm:p-5 flex flex-col justify-between">
            {/* Top Sprint Bar */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
                      Sprint 24 · Core Architecture & AI Engine
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      ON TRACK
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> 3 days remaining
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-400" /> 48 / 56 Story Points
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-400" /> release/v2.4.0
                    </span>
                  </div>
                </div>

                {/* Team Avatars & Actions */}
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2 overflow-hidden">
                    {[
                      { name: "Sarah L.", bg: "bg-violet-600", text: "SL" },
                      { name: "Alex R.", bg: "bg-indigo-600", text: "AR" },
                      { name: "David C.", bg: "bg-blue-600", text: "DC" },
                      { name: "Priya S.", bg: "bg-emerald-600", text: "PS" },
                    ].map((user, idx) => (
                      <div
                        key={idx}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${user.bg} text-white font-bold text-[10px] ring-2 ring-[#090d19] shadow-sm`}
                        title={user.name}
                      >
                        {user.text}
                      </div>
                    ))}
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] ring-2 ring-[#090d19]">
                      +8
                    </div>
                  </div>

                  <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-semibold transition-colors">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span>AI Copilot</span>
                  </button>
                </div>
              </div>

              {/* Kanban Columns Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {mockColumns.map((col) => (
                  <div
                    key={col.id}
                    className="flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 min-h-[380px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: col.color }}
                        />
                        <span className="text-xs font-bold text-slate-200">{col.name}</span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-white/[0.06] px-1.5 py-0.5 rounded-md">
                          {col.cards.length}
                        </span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
                    </div>

                    {/* Column Cards */}
                    <div className="space-y-2.5 flex-1">
                      {col.cards.map((card) => {
                        const isSelected = selectedCardId === card.id;
                        return (
                          <div
                            key={card.id}
                            onClick={() => setSelectedCardId(card.id)}
                            className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-violet-950/30 border-violet-500/50 shadow-[0_4px_20px_rgba(124,92,255,0.15)] ring-1 ring-violet-500/30"
                                : "bg-[#0c1122]/80 border-white/[0.07] hover:border-white/[0.18] hover:bg-[#10172e]/90"
                            }`}
                          >
                            {/* Card top tag and key */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-semibold text-slate-400">
                                  {card.key}
                                </span>
                                <span
                                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${card.tagColor}`}
                                >
                                  {card.tag}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider ${
                                  card.priority === "critical"
                                    ? "text-rose-400"
                                    : card.priority === "high"
                                    ? "text-amber-400"
                                    : "text-blue-400"
                                }`}
                              >
                                {card.priority}
                              </span>
                            </div>

                            {/* Card Title */}
                            <h3 className="text-xs font-semibold text-slate-100 mb-3 leading-snug line-clamp-2">
                              {card.title}
                            </h3>

                            {/* Subtask progress bar */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>
                                    {card.subtasks.done}/{card.subtasks.total} subtasks
                                  </span>
                                </span>
                                <span>{Math.round((card.subtasks.done / card.subtasks.total) * 100)}%</span>
                              </div>
                              <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                                  style={{
                                    width: `${(card.subtasks.done / card.subtasks.total) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Card footer with Assignee and Comments */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`w-4 h-4 rounded-full ${card.assignee.color} flex items-center justify-center text-[8px] font-bold text-white`}
                                >
                                  {card.assignee.avatar}
                                </div>
                                <span className="truncate max-w-[80px]">{card.assignee.name.split(" ")[0]}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-400">
                                <MessageSquare className="w-3 h-3" />
                                <span>{card.commentsCount}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Insight Bar */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 bg-white/[0.01] px-3 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-violet-400" />
                <span className="text-slate-300 font-medium">Sprint AI Prediction:</span>
                <span className="text-slate-400">Sprint 24 completion confidence is 96.4%. 0 critical blockers.</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span>Velocity: +18% vs last sprint</span>
                <span className="text-violet-400 font-semibold cursor-pointer hover:underline">View Burndown →</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
