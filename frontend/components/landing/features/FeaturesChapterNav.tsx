"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, FolderKanban, Radio, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";

interface ChapterItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: any;
}

const chapters: ChapterItem[] = [
  { id: "sprint-planning", label: "01. Planning", shortLabel: "Planning", icon: Clock },
  { id: "kanban-scrum", label: "02. Execution", shortLabel: "Kanban", icon: FolderKanban },
  { id: "live-presence", label: "03. Presence", shortLabel: "Presence", icon: Radio },
  { id: "team-chat", label: "04. Chat", shortLabel: "Chat", icon: MessageSquare },
  { id: "permissions-rbac", label: "05. Governance", shortLabel: "RBAC", icon: ShieldCheck },
  { id: "ai-engine", label: "06. AI Engine", shortLabel: "AI Copilot", icon: Sparkles },
];

export function FeaturesChapterNav() {
  const [activeChapter, setActiveChapter] = useState<string>("sprint-planning");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;

      for (let i = chapters.length - 1; i >= 0; i--) {
        const el = document.getElementById(chapters[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveChapter(chapters[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-20 z-30 flex justify-center px-4 py-2 pointer-events-none mb-8">
      <div className="pointer-events-auto inline-flex items-center gap-1 p-1.5 rounded-full bg-[#080c18]/90 border border-white/[0.1] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] max-w-full overflow-x-auto">
        {chapters.map((ch) => {
          const Icon = ch.icon;
          const isActive = activeChapter === ch.id;

          return (
            <button
              key={ch.id}
              onClick={() => scrollTo(ch.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span className="hidden sm:inline">{ch.label}</span>
              <span className="sm:hidden">{ch.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
