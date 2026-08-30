"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit3,
  Save,
  Trash2,
  Share2,
  Sparkles,
  Check,
  Copy,
  BookOpen,
  FileText,
  Clock,
  User,
  List,
  Layers,
  ChevronRight,
  Plus,
  Loader2,
  Eye,
} from "lucide-react";
import { wikiAPI } from "@/lib/api";
import { formatDate, generateAvatar, cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import toast from "react-hot-toast";
import { WikiAIAssistModal } from "./WikiAIAssistModal";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const MDPreview = dynamic(() => import("@uiw/react-md-editor").then((m) => m.default.Markdown), { ssr: false });

interface WikiDocumentViewProps {
  page: any;
  pages: any[];
  projectId: string;
  onBackToHome: () => void;
  onSelectPage: (page: any) => void;
  onOpenCreate: () => void;
  onPageUpdated: (updatedPage: any) => void;
  onPageDeleted: (pageId: string) => void;
}

export function WikiDocumentView({
  page,
  pages = [],
  projectId,
  onBackToHome,
  onSelectPage,
  onOpenCreate,
  onPageUpdated,
  onPageDeleted,
}: WikiDocumentViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [tags, setTags] = useState<string[]>(page.tags || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setTitle(page.title);
    setContent(page.content);
    setTags(page.tags || []);
    setIsEditing(false);
    setShowDeleteConfirm(false);
  }, [page._id]);

  // Extract headings for Table of Contents
  const tableOfContents = useMemo(() => {
    if (!content) return [];
    const lines = content.split("\n");
    const headings: { id: string; text: string; level: number }[] = [];
    lines.forEach((line: string) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        headings.push({ id, text, level });
      }
    });
    return headings;
  }, [content]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: updated } = await wikiAPI.update(page._id, {
        title: title.trim(),
        content: content,
        tags: tags,
      });
      onPageUpdated(updated);
      setIsEditing(false);
      toast.success("Document saved! ✓");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success("Document link copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = async () => {
    try {
      await wikiAPI.delete(page._id);
      toast.success("Document deleted");
      onPageDeleted(page._id);
    } catch {
      toast.error("Failed to delete page");
    }
  };

  const handleInsertAIContent = (snippet: string) => {
    setContent((prev: string) => `${prev}${snippet}`);
    setIsEditing(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── 1. TOP DOCUMENT HEADER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Back to Knowledge Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span onClick={onBackToHome} className="hover:text-white cursor-pointer">
                Knowledge Hub
              </span>
              <span>/</span>
              <span className="text-violet-400 capitalize">
                {page.tags?.[0] || "General"}
              </span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-bold text-white bg-transparent border-0 focus:outline-none w-full"
                placeholder="Page Title"
              />
            ) : (
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {page.title}
              </h1>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* AI Assist */}
          <button
            onClick={() => setShowAIAssist(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assist</span>
          </button>

          {/* Share */}
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Copy document link"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          {/* Edit / View Mode Toggle */}
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setContent(page.content);
                  setTitle(page.title);
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(124,92,255,0.4)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Document</span>
            </button>
          )}

          {/* Delete */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Delete page"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. 3-COLUMN DOCUMENT WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Page Navigation Tree (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Documents Tree
            </span>
            <button
              onClick={onOpenCreate}
              className="p-1 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
              title="Create new page"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-[#090d1f] border border-white/[0.08] space-y-1 max-h-[70vh] overflow-y-auto">
            {pages.map((p) => {
              const isSelected = p._id === page._id;
              return (
                <div
                  key={p._id}
                  onClick={() => onSelectPage(p)}
                  className={cn(
                    "p-2 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between gap-2",
                    isSelected
                      ? "bg-violet-600/20 text-white font-bold border border-violet-500/40"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
                    <span className="truncate">{p.title}</span>
                  </div>
                  {p.tags?.[0] && (
                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      {p.tags[0]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN: Document Viewer / Live Editor (6 cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-xl overflow-hidden min-h-[500px]">
          {isEditing ? (
            <div className="p-4" data-color-mode="dark">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || "")}
                height={500}
                preview="edit"
              />
            </div>
          ) : (
            <div className="p-8 prose prose-invert prose-violet max-w-none prose-headings:font-black prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-pre:bg-[#060914] prose-pre:border prose-pre:border-white/[0.08] prose-code:text-violet-300 font-sans leading-relaxed">
              <MDPreview source={content} />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Table of Contents & Metadata (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Table of Contents */}
          {tableOfContents.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                <List className="w-3.5 h-3.5 text-violet-400" />
                <span>On This Page</span>
              </div>
              <div className="space-y-1 text-xs">
                {tableOfContents.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "text-slate-400 hover:text-violet-300 transition-colors cursor-pointer truncate py-0.5",
                      item.level === 2 && "pl-2",
                      item.level === 3 && "pl-4 text-[11px]"
                    )}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Metadata Card */}
          <div className="p-4 rounded-2xl bg-[#090d1f] border border-white/[0.08] space-y-3 text-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Document Attributes
            </span>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Author:</span>
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <UserAvatar
                    src={page.author?.avatar}
                    name={page.author?.name}
                    size="xs"
                  />
                  <span>{page.author?.name || "Member"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Updated:</span>
                <span className="font-mono text-slate-300">
                  {formatDate(page.updatedAt, "relative")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Revision Version:</span>
                <span className="font-mono text-violet-300 font-bold">
                  v{page.version || 1}
                </span>
              </div>
            </div>

            {/* Tags list */}
            {page.tags?.length > 0 && (
              <div className="pt-3 border-t border-white/[0.04] space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Tags:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {page.tags.map((t: string) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.06]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Assist Modal */}
      <WikiAIAssistModal
        isOpen={showAIAssist}
        onClose={() => setShowAIAssist(false)}
        documentTitle={page.title}
        currentContent={content}
        onInsertContent={handleInsertAIContent}
      />
    </div>
  );
}
