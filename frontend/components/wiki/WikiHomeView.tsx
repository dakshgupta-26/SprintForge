"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  BookOpen,
  Terminal,
  Code2,
  Shield,
  Layers,
  Sparkles,
  FileText,
  Clock,
  User,
  ChevronRight,
  Tag,
  Activity,
} from "lucide-react";
import { formatDate, generateAvatar, cn } from "@/lib/utils";

interface WikiHomeViewProps {
  pages: any[];
  projectName?: string;
  onOpenCreate: () => void;
  onSelectPage: (page: any) => void;
}

const CATEGORY_CARDS = [
  {
    title: "Getting Started",
    desc: "Set up the project, prerequisites, and developer workflows.",
    icon: Terminal,
    tag: "setup",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Architecture & ADRs",
    desc: "System design, service boundaries, and decision records.",
    icon: Layers,
    tag: "architecture",
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    title: "API Reference",
    desc: "REST endpoints, auth schemas, and response contracts.",
    icon: Code2,
    tag: "api",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    title: "Runbooks & DevOps",
    desc: "Deployment steps, monitoring telemetry, and rollbacks.",
    icon: Shield,
    tag: "runbook",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  {
    title: "Project Overview",
    desc: "High-level mission, key features, and team ownership.",
    icon: BookOpen,
    tag: "overview",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "Sprint & Release Notes",
    desc: "Shipped features, bug fixes, and changelog updates.",
    icon: Sparkles,
    tag: "general",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
];

export function WikiHomeView({
  pages = [],
  projectName = "TASKDEV",
  onOpenCreate,
  onSelectPage,
}: WikiHomeViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Collect all unique tags from pages
  const allTags = useMemo(() => {
    const set = new Set<string>();
    pages.forEach((p) => {
      p.tags?.forEach((t: string) => set.add(t));
    });
    return Array.from(set);
  }, [pages]);

  // Filtered pages
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const titleMatch = page.title?.toLowerCase().includes(q);
        const contentMatch = page.content?.toLowerCase().includes(q);
        const authorMatch = page.author?.name?.toLowerCase().includes(q);
        const tagMatch = page.tags?.some((t: string) => t.toLowerCase().includes(q));
        if (!titleMatch && !contentMatch && !authorMatch && !tagMatch) return false;
      }
      if (selectedTag !== "all") {
        if (!page.tags?.includes(selectedTag)) return false;
      }
      return true;
    });
  }, [pages, searchQuery, selectedTag]);

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. HEADER & SEARCH ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Engineering Knowledge
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">{projectName}</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">
              {pages.length} document{pages.length === 1 ? "" : "s"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Knowledge Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Everything your team needs to build, ship, operate, and maintain {projectName}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(124,92,255,0.35)] hover:shadow-[0_0_28px_rgba(124,92,255,0.55)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* ── 2. SEARCH & TAG FILTER BAR ── */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documentation by title, content, author, or keywords... (Press '/' to focus)"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/[0.08] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-600 font-sans"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedTag("all")}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer",
                selectedTag === "all"
                  ? "bg-violet-600/20 border border-violet-500/50 text-violet-300"
                  : "bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white"
              )}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer capitalize",
                  selectedTag === tag
                    ? "bg-violet-600/20 border border-violet-500/50 text-violet-300"
                    : "bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. GET STARTED CATEGORIES ── */}
      {pages.length === 0 ? (
        /* ── Rich Empty State ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 rounded-3xl bg-[#090d1f] border border-white/[0.08] text-center space-y-6 shadow-xl"
        >
          <div className="w-16 h-16 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400">
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-black text-white tracking-tight">
              Your Team&apos;s Knowledge Starts Here
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Build a shared source of truth for architecture, developer setup, API contracts, and runbooks.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onOpenCreate}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(124,92,255,0.4)] cursor-pointer"
            >
              + Create First Document
            </button>
          </div>

          {/* Quick starter cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/[0.06] text-left">
            <div
              onClick={onOpenCreate}
              className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-violet-500/30 transition-all cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-emerald-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">Engineering Setup</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Local run & env guides</p>
            </div>

            <div
              onClick={onOpenCreate}
              className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-violet-500/30 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-violet-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">System Architecture</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">ADRs & technical schemas</p>
            </div>

            <div
              onClick={onOpenCreate}
              className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-violet-500/30 transition-all cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-blue-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">API Reference</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">REST payloads & endpoints</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* ── Topic Categories Quick Links ── */}
          <div>
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
              Knowledge Categories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORY_CARDS.map((cat, i) => {
                const Icon = cat.icon;
                const matchCount = pages.filter((p) =>
                  p.tags?.some((t: string) => t.toLowerCase() === cat.tag)
                ).length;

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedTag(cat.tag)}
                    className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] hover:border-violet-500/30 transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-xs border",
                          cat.color
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {matchCount} doc{matchCount === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 4. DOCUMENTATION DIRECTORY ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Documents List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Documentation Pages ({filteredPages.length})
                </h2>
              </div>

              {filteredPages.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#090d1f] border border-white/[0.08] text-center text-xs text-slate-400">
                  No documents found matching &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04] rounded-3xl border border-white/[0.08] bg-[#090d1f] overflow-hidden shadow-lg">
                  {filteredPages.map((page) => (
                    <div
                      key={page._id}
                      onClick={() => onSelectPage(page)}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                              {page.title}
                            </h3>
                            {page.tags?.map((t: string) => (
                              <span
                                key={t}
                                className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06]"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                            <span>{page.author?.name || "Team Member"}</span>
                            <span>•</span>
                            <span>Updated {formatDate(page.updatedAt, "relative")}</span>
                            <span>•</span>
                            <span>v{page.version || 1}</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Sidebar */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Recent Knowledge Activity
              </h2>

              <div className="p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] space-y-4 shadow-lg">
                {pages.slice(0, 5).map((p) => (
                  <div
                    key={p._id}
                    onClick={() => onSelectPage(p)}
                    className="flex items-start gap-3 text-xs cursor-pointer group"
                  >
                    <img
                      src={
                        p.author?.avatar ||
                        generateAvatar(p.author?.name || "U")
                      }
                      alt=""
                      className="w-6 h-6 rounded-full object-cover border border-white/[0.1] mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-300 font-medium leading-snug">
                        <span className="font-bold text-white">{p.author?.name}</span>{" "}
                        updated{" "}
                        <span className="text-violet-300 group-hover:underline">
                          {p.title}
                        </span>
                      </p>
                      <span className="text-[10px] font-mono text-slate-500">
                        {formatDate(p.updatedAt, "relative")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
