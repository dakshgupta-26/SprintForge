"use client";

import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  FolderKanban,
  Hash,
  Zap,
  Columns3,
  AlignLeft,
  Lock,
  Globe,
  Check,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
  Calendar,
  Users,
  Terminal,
} from "lucide-react";
import { useProjectStore } from "@/lib/store/projectStore";
import toast from "react-hot-toast";

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (project: any) => void;
}

const IDENTITY_COLORS = [
  { label: "Purple", hex: "#6366f1", bg: "bg-[#6366f1]", ring: "ring-[#6366f1]" },
  { label: "Violet", hex: "#8b5cf6", bg: "bg-[#8b5cf6]", ring: "ring-[#8b5cf6]" },
  { label: "Blue", hex: "#3b82f6", bg: "bg-[#3b82f6]", ring: "ring-[#3b82f6]" },
  { label: "Cyan", hex: "#06b6d4", bg: "bg-[#06b6d4]", ring: "ring-[#06b6d4]" },
  { label: "Emerald", hex: "#10b981", bg: "bg-[#10b981]", ring: "ring-[#10b981]" },
  { label: "Amber", hex: "#f59e0b", bg: "bg-[#f59e0b]", ring: "ring-[#f59e0b]" },
  { label: "Rose", hex: "#f43f5e", bg: "bg-[#f43f5e]", ring: "ring-[#f43f5e]" },
  { label: "Pink", hex: "#ec4899", bg: "bg-[#ec4899]", ring: "ring-[#ec4899]" },
];

export function CreateProjectModal({ onClose, onCreate }: CreateProjectModalProps) {
  const { createProject, projects } = useProjectStore();
  const [isLoading, setIsLoading] = useState(false);
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    type: "scrum" as "scrum" | "kanban",
    isPrivate: false,
    color: "#6366f1",
  });

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isLoading]);

  // Derive intelligent key from project name if not manually edited
  const handleNameChange = (val: string) => {
    const newName = val;
    let newKey = form.key;

    if (!keyManuallyEdited) {
      // Split words and take initials, or first 3-4 letters
      const words = newName
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (words.length >= 2) {
        newKey = words
          .slice(0, 3)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
      } else if (words.length === 1) {
        newKey = words[0]
          .slice(0, 4)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
      } else {
        newKey = "";
      }
      newKey = newKey.slice(0, 6);
    }

    setForm((f) => ({ ...f, name: newName, key: newKey }));
  };

  const handleKeyChange = (val: string) => {
    setKeyManuallyEdited(true);
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setForm((f) => ({ ...f, key: cleaned }));
  };

  // Check key uniqueness
  const isKeyExisting =
    form.key.length >= 2 &&
    projects.some((p) => p.key?.toUpperCase() === form.key.toUpperCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedKey = form.key.trim();

    if (!trimmedName) {
      toast.error("Please enter a project name");
      return;
    }

    if (!trimmedKey) {
      toast.error("Please enter a project key");
      return;
    }

    if (trimmedKey.length < 2) {
      toast.error("Project key must be at least 2 characters");
      return;
    }

    if (isKeyExisting) {
      toast.error("This project key is already in use by another project");
      return;
    }

    setIsLoading(true);
    try {
      const project = await createProject({
        ...form,
        name: trimmedName,
        key: trimmedKey,
        description: form.description.trim(),
      });
      toast.success("Project workspace initialized! 🚀");
      onCreate(project);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || "Failed to create project";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleKey = form.key || "SFG";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      {/* ─── Backdrop Blur & Atmosphere ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={isLoading ? undefined : onClose}
        className="fixed inset-0 bg-[#03060f]/80 backdrop-blur-md cursor-pointer"
      />

      {/* ─── Soft Ambient Purple Backlight ─── */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[450px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ─── Main Modal Window ─── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl bg-[#090d1c]/95 border border-white/[0.1] rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(124,92,255,0.12)] z-10 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Subtle Top Border Sheen */}
        <div className="absolute top-0 inset-x-16 h-[1px] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent pointer-events-none" />

        {/* ─── Header ─── */}
        <div className="px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[10px] sm:text-[11px] font-bold text-violet-300 uppercase tracking-widest font-mono">
                <FolderKanban className="w-3 h-3 text-violet-400" />
                New Project
              </span>
            </div>
            <h2
              id="create-project-title"
              className="text-lg sm:text-xl font-black text-white tracking-tight"
            >
              Create a new project
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Set up your workspace and start your first sprint.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Body: 2-Column Desktop Grid ─── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          <form id="create-project-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* ─── LEFT COLUMN: Project Configuration (7 cols) ─── */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                {/* 1. Project Name (Hero Field) */}
                <div>
                  <label
                    htmlFor="project-name"
                    className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    Project Name <span className="text-violet-400">*</span>
                  </label>
                  <div
                    className={`relative rounded-xl border transition-all duration-200 ${
                      isFocused === "name"
                        ? "border-violet-500 shadow-[0_0_20px_rgba(124,92,255,0.25)] bg-[#0d1226]"
                        : "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.18]"
                    }`}
                  >
                    <input
                      id="project-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      onFocus={() => setIsFocused("name")}
                      onBlur={() => setIsFocused(null)}
                      placeholder="e.g. Customer Platform"
                      required
                      autoFocus
                      maxLength={80}
                      className="w-full px-4 py-3 bg-transparent text-white placeholder:text-slate-500 text-sm sm:text-base font-medium focus:outline-none rounded-xl"
                    />
                  </div>
                </div>

                {/* 2. Project Key (Engineering Identifier) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="project-key"
                      className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider"
                    >
                      Project Key <span className="text-violet-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Used for tickets & references
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`relative flex-1 rounded-xl border transition-all duration-200 ${
                        isFocused === "key"
                          ? "border-violet-500 shadow-[0_0_20px_rgba(124,92,255,0.25)] bg-[#0d1226]"
                          : isKeyExisting
                          ? "border-rose-500/80 bg-rose-500/5"
                          : "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.18]"
                      }`}
                    >
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        <Hash className="w-4 h-4" />
                      </div>
                      <input
                        id="project-key"
                        type="text"
                        value={form.key}
                        onChange={(e) => handleKeyChange(e.target.value)}
                        onFocus={() => setIsFocused("key")}
                        onBlur={() => setIsFocused(null)}
                        placeholder="e.g. SFG"
                        required
                        maxLength={6}
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent text-white placeholder:text-slate-500 font-mono text-sm font-bold tracking-wider focus:outline-none rounded-xl uppercase"
                      />
                    </div>

                    {/* Key Validation Indicator */}
                    <div className="min-w-[110px] flex items-center">
                      {form.key.length >= 2 ? (
                        isKeyExisting ? (
                          <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            Already exists
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Available
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                          2–6 chars
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Micro Ticket Preview */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400">Issue previews:</span>
                    <span className="text-[10px] font-mono font-semibold text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
                      {sampleKey}-001
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.06]">
                      {sampleKey}-002
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.06]">
                      {sampleKey}-003
                    </span>
                  </div>
                </div>

                {/* 3. Project Type (Scrum vs Kanban) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Project Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Scrum Option */}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: "scrum" }))}
                      className={`relative flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        form.type === "scrum"
                          ? "bg-violet-500/15 border-violet-500/60 shadow-[0_0_20px_rgba(124,92,255,0.15)]"
                          : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Zap
                            className={`w-3.5 h-3.5 ${
                              form.type === "scrum"
                                ? "text-violet-400"
                                : "text-slate-400"
                            }`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              form.type === "scrum"
                                ? "text-white"
                                : "text-slate-300"
                            }`}
                          >
                            Scrum
                          </span>
                        </div>
                        {form.type === "scrum" && (
                          <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Sprint-based planning & velocity tracking
                      </p>
                    </button>

                    {/* Kanban Option */}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: "kanban" }))}
                      className={`relative flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        form.type === "kanban"
                          ? "bg-cyan-500/15 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                          : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Columns3
                            className={`w-3.5 h-3.5 ${
                              form.type === "kanban"
                                ? "text-cyan-400"
                                : "text-slate-400"
                            }`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              form.type === "kanban"
                                ? "text-white"
                                : "text-slate-300"
                            }`}
                          >
                            Kanban
                          </span>
                        </div>
                        {form.type === "kanban" && (
                          <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Continuous delivery with flexible workflow
                      </p>
                    </button>
                  </div>
                </div>

                {/* 4. Description Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="project-desc"
                      className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider"
                    >
                      Project Description
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {form.description.length} / 240
                    </span>
                  </div>
                  <div
                    className={`relative rounded-xl border transition-all duration-200 ${
                      isFocused === "desc"
                        ? "border-violet-500 shadow-[0_0_20px_rgba(124,92,255,0.25)] bg-[#0d1226]"
                        : "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.18]"
                    }`}
                  >
                    <textarea
                      id="project-desc"
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          description: e.target.value.slice(0, 240),
                        }))
                      }
                      onFocus={() => setIsFocused("desc")}
                      onBlur={() => setIsFocused(null)}
                      placeholder="What are you building? Add goals, scope, or context for your team..."
                      rows={2}
                      maxLength={240}
                      className="w-full px-3.5 py-2.5 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none rounded-xl resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* 5. Project Identity (Color Palette) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Project Identity
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {IDENTITY_COLORS.map((col) => {
                      const isSelected = form.color === col.hex;
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, color: col.hex }))}
                          aria-label={`Select ${col.label} theme`}
                          className={`relative w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                            col.bg
                          } ${
                            isSelected
                              ? "scale-110 ring-2 ring-offset-2 ring-offset-[#090d1c] " +
                                col.ring
                              : "hover:scale-105 opacity-80 hover:opacity-100"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Workspace Visibility (Privacy Card) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Workspace Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, isPrivate: false }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        !form.isPrivate
                          ? "bg-white/[0.06] border-violet-400/40 text-white"
                          : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.12]"
                      }`}
                    >
                      <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          Team Workspace
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          Discoverable by everyone in your organization
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, isPrivate: true }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        form.isPrivate
                          ? "bg-violet-500/15 border-violet-400/50 text-white"
                          : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.12]"
                      }`}
                    >
                      <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          Private Project
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          Only invited team members can view & contribute
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* ─── RIGHT COLUMN: Live Agile Project Preview (5 cols) ─── */}
              <div className="lg:col-span-5 flex flex-col justify-start space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    Live Project Preview
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Active Preview
                  </span>
                </div>

                {/* ─── Miniature Realistic Project Card ─── */}
                <div className="relative rounded-2xl bg-[#060913] border border-white/[0.1] p-4 sm:p-5 shadow-2xl overflow-hidden group">
                  {/* Glowing Project Accent Header Bar */}
                  <div
                    className="absolute top-0 inset-x-0 h-1 transition-colors duration-300"
                    style={{ backgroundColor: form.color }}
                  />

                  {/* Project Identity & Key */}
                  <div className="flex items-start gap-3 mt-1 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg transition-colors duration-300 flex-shrink-0"
                      style={{ backgroundColor: form.color }}
                    >
                      {form.key ? form.key.charAt(0) : "P"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {form.name || "Customer Platform"}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono font-bold text-violet-300 bg-violet-500/15 px-1.5 py-0.5 rounded border border-violet-500/25">
                          {sampleKey}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                          {form.type}
                        </span>
                        <span className="text-[10px] text-slate-500">•</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          {form.isPrivate ? (
                            <>
                              <Lock className="w-2.5 h-2.5 text-amber-400" /> Private
                            </>
                          ) : (
                            <>
                              <Globe className="w-2.5 h-2.5 text-emerald-400" /> Team
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description Preview */}
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed min-h-[36px]">
                    {form.description ||
                      "Building the next-generation workspace for high-velocity software engineering teams."}
                  </p>

                  {/* Agile Board Workflow Micro-Stage */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-3">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                      <span className="flex items-center gap-1 font-bold text-slate-300">
                        <Layers className="w-3 h-3 text-violet-400" />
                        Agile Workflow
                      </span>
                      <span className="text-violet-400">Ready to plan</span>
                    </div>

                    {/* Sequential Workflow Columns */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-1.5 rounded-lg bg-[#0b1022] border border-white/[0.06]">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                          Backlog
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-200">
                          0
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#0b1022] border border-violet-500/20">
                        <span className="block text-[8px] font-bold text-violet-300 uppercase tracking-wider">
                          In Prog
                        </span>
                        <span className="text-[11px] font-mono font-bold text-violet-300">
                          0
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#0b1022] border border-amber-500/20">
                        <span className="block text-[8px] font-bold text-amber-300 uppercase tracking-wider">
                          Review
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-300">
                          0
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#0b1022] border border-emerald-500/20">
                        <span className="block text-[8px] font-bold text-emerald-300 uppercase tracking-wider">
                          Done
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-300">
                          0
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sprint Status Bottom Strip */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Zap className="w-3 h-3 text-violet-400" />
                      {form.type === "scrum" ? "Sprint 01 • Next" : "Kanban Board • Active"}
                    </span>
                    <span className="text-slate-500">1 Member (You)</span>
                  </div>
                </div>

                {/* Helpful Engineering Context Note */}
                <div className="p-3 rounded-xl bg-violet-500/[0.05] border border-violet-500/15 text-[11px] text-slate-400 leading-relaxed">
                  <span className="font-semibold text-violet-300 block mb-0.5">
                    ✦ Instant Workspace Initialization
                  </span>
                  Your board, backlog, sprint engine, and real-time team chat will be
                  provisioned immediately.
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* ─── Footer: Action Buttons ─── */}
        <div className="px-5 sm:px-8 py-4 bg-[#070a16] border-t border-white/[0.06] flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-xs sm:text-sm font-semibold text-slate-400 hover:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="create-project-form"
            disabled={isLoading || isKeyExisting || !form.name.trim() || !form.key.trim()}
            className="relative group flex items-center justify-center gap-2 py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_24px_rgba(124,92,255,0.4)] hover:shadow-[0_0_34px_rgba(124,92,255,0.65)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer overflow-hidden"
          >
            {/* Subtle button sheen */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 pointer-events-none" />

            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Initializing workspace...</span>
              </>
            ) : (
              <>
                <span>Create project</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
