"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  FileText,
  HelpCircle,
  ShieldCheck,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface WikiAIAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  currentContent: string;
  onInsertContent: (snippet: string) => void;
}

export function WikiAIAssistModal({
  isOpen,
  onClose,
  documentTitle,
  currentContent,
  onInsertContent,
}: WikiAIAssistModalProps) {
  const [selectedAction, setSelectedAction] = useState<string>("summary");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSnippet, setGeneratedSnippet] = useState<string>("");

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setGeneratedSnippet("");

    setTimeout(() => {
      let result = "";
      if (selectedAction === "summary") {
        result = `\n\n## 📋 Executive Summary\n- **Target Scope**: Documents the core operational workflows and engineering architecture for ${documentTitle}.\n- **Key Systems**: Integrates with frontend state stores, background workers, and REST/WebSocket gateways.\n- **Maintenance Ownership**: Engineering Team\n`;
      } else if (selectedAction === "gaps") {
        result = `\n\n## 🔍 Architectural Considerations & Security Guardrails\n- **Security & RBAC**: Ensure strict JWT verification on all internal API calls.\n- **Data Consistency**: Implement idempotent mutation retries with exponential backoff.\n- **Monitoring & Telemetry**: Track request duration and error frequencies through Prometheus / OpenTelemetry.\n`;
      } else if (selectedAction === "faq") {
        result = `\n\n## ❓ Frequently Asked Questions & Troubleshooting\n\n**Q: How do I test this service locally?**\nRun \`npm run test\` within the service directory or verify with mock payloads.\n\n**Q: What should I do if socket connections drop?**\nCheck token expiration and verify the client initiates automatic reconnection with backoff.\n`;
      } else {
        result = `\n\n## 💡 Engineering Best Practices\n1. Follow standard TypeScript strict mode type annotations.\n2. Write unit tests for all domain calculation helpers.\n3. Keep documentation updated during pull request reviews.\n`;
      }

      setGeneratedSnippet(result);
      setIsGenerating(false);
    }, 600);
  };

  const handleInsert = () => {
    if (!generatedSnippet) return;
    onInsertContent(generatedSnippet);
    toast.success("AI suggestion inserted into document! ✨");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md">
        {/* Backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-[#090d1f] border border-violet-500/30 rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden z-10 my-auto flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Wiki AI Assistant
                </h2>
                <p className="text-[11px] font-mono text-slate-400">
                  Generate summaries, find architectural gaps, or add troubleshooting FAQs
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedAction("summary");
                  setGeneratedSnippet("");
                }}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                  selectedAction === "summary"
                    ? "bg-violet-600/20 border-violet-500/60 text-white"
                    : "bg-[#060914] border-white/[0.06] text-slate-400 hover:bg-white/[0.03]"
                )}
              >
                <FileText className="w-4 h-4 text-violet-400 mb-1.5" />
                <p className="text-xs font-bold">Executive Summary</p>
                <p className="text-[10px] text-slate-400">Add overview notes</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedAction("gaps");
                  setGeneratedSnippet("");
                }}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                  selectedAction === "gaps"
                    ? "bg-violet-600/20 border-violet-500/60 text-white"
                    : "bg-[#060914] border-white/[0.06] text-slate-400 hover:bg-white/[0.03]"
                )}
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400 mb-1.5" />
                <p className="text-xs font-bold">Security & Gaps</p>
                <p className="text-[10px] text-slate-400">Identify missing details</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedAction("faq");
                  setGeneratedSnippet("");
                }}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                  selectedAction === "faq"
                    ? "bg-violet-600/20 border-violet-500/60 text-white"
                    : "bg-[#060914] border-white/[0.06] text-slate-400 hover:bg-white/[0.03]"
                )}
              >
                <HelpCircle className="w-4 h-4 text-amber-400 mb-1.5" />
                <p className="text-xs font-bold">FAQ & Troubleshooting</p>
                <p className="text-[10px] text-slate-400">Generate Q&A blocks</p>
              </button>
            </div>

            {/* Generate Trigger */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(124,92,255,0.4)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Proposal</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Preview */}
            {generatedSnippet && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Generated Proposal Preview:
                </label>
                <div className="p-4 rounded-2xl bg-[#060914] border border-white/[0.08] text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {generatedSnippet}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white"
            >
              Close
            </button>

            {generatedSnippet && (
              <button
                type="button"
                onClick={handleInsert}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Insert into Document</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
