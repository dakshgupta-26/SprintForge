"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Layers,
  Code2,
  Terminal,
  Shield,
  BookOpen,
  Sparkles,
  Loader2,
  Plus,
} from "lucide-react";
import { wikiAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface CreateWikiPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  onPageCreated: (newPage: any) => void;
}

const TEMPLATES = [
  {
    id: "blank",
    title: "Blank Document",
    desc: "Start from scratch with a clean markdown document.",
    icon: FileText,
    category: "General",
    tags: ["general"],
    content: (title: string) => `# ${title}\n\nStart writing your engineering documentation here...\n`,
  },
  {
    id: "overview",
    title: "Project Overview",
    desc: "High-level architecture, mission, core features, and tech stack.",
    icon: BookOpen,
    category: "Getting Started",
    tags: ["overview", "architecture"],
    content: (title: string) => `# ${title}

## 🎯 Overview & Mission
Provide a concise 2-3 sentence overview of this project's core mission, engineering purpose, and key stakeholders.

## 🛠 Tech Stack & Architecture
- **Frontend**: Next.js 16, React 19, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, TypeScript, Socket.IO
- **Database**: MongoDB & Redis Caching
- **Infrastructure**: Docker, AWS / Vercel

## 🚀 Key Features
1. **Real-time Agile Collaboration**: Sprints, Boards, Backlogs, and live Presence.
2. **Telemetry & Insights**: Telemetry-driven burndown and cycle time metrics.
3. **Engineering Knowledge**: Centralized documentation and runbooks.

## 👥 Core Contributors
- **Product & Lead**: Engineering Team
`,
  },
  {
    id: "setup",
    title: "Engineering Setup Guide",
    desc: "Local environment setup, prerequisite tools, and contribution steps.",
    icon: Terminal,
    category: "Development",
    tags: ["setup", "workflow"],
    content: (title: string) => `# ${title}

## ⚙️ Prerequisites
Ensure you have the following installed locally:
- Node.js >= 20.x
- Docker or local MongoDB instance (port 27017)
- Git & npm

## 📦 Quickstart Setup

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/org/repo.git
cd repo

# 2. Install backend & frontend dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Configure environment files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 4. Start local development servers
npm run dev
\`\`\`

## 🧪 Running Tests & Linter
\`\`\`bash
npm run test
npm run lint
\`\`\`
`,
  },
  {
    id: "api",
    title: "API Reference & Endpoints",
    desc: "REST endpoint specifications, authentication schemas, and payloads.",
    icon: Code2,
    category: "API",
    tags: ["api", "backend"],
    content: (title: string) => `# ${title}

## 🔐 Authentication Schema
All authenticated requests must include the Bearer token in headers:
\`\`\`http
Authorization: Bearer <JWT_TOKEN>
\`\`\`

## 📡 Endpoints Table

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| \`GET\` | \`/api/projects/:id\` | Fetch project details and membership | Yes |
| \`POST\` | \`/api/tasks\` | Create a new task or backlog item | Yes |
| \`GET\` | \`/api/analytics/project/:id\` | Fetch telemetry and delivery metrics | Yes |

## 📝 Sample Request & Response
\`\`\`json
{
  "title": "Implement passwordless authentication",
  "type": "story",
  "priority": "high",
  "storyPoints": 5
}
\`\`\`
`,
  },
  {
    id: "adr",
    title: "Architecture Decision Record (ADR)",
    desc: "Document architectural decisions, technical tradeoffs, and rationale.",
    icon: Layers,
    category: "Architecture",
    tags: ["architecture", "adr"],
    content: (title: string) => `# ADR-001: ${title}

## 📌 Status
**Proposed** | **Accepted** | **Superseded**

## 🔍 Context & Problem Statement
Describe the technical challenge, problem, or decision facing the team. What constraints are present?

## 💡 Decision & Rationale
We decided to adopt... because:
1. Low latency delivery for real-time collaboration.
2. Strong typing and schema consistency.

## ⚖️ Consequences & Tradeoffs
- **Positive**: High throughput, seamless developer experience.
- **Negative**: Additional infrastructure memory footprint.
`,
  },
  {
    id: "runbook",
    title: "Deployment & Incident Runbook",
    desc: "Production rollout steps, health check diagnostics, and rollbacks.",
    icon: Shield,
    category: "Operations",
    tags: ["runbook", "operations", "devops"],
    content: (title: string) => `# ${title}

## 🚀 Deployment Pipeline
1. Ensure all CI/CD integration tests pass on \`main\`.
2. Verify Docker image build and database migrations.
3. Deploy to staging environment and run smoke tests.
4. Promote image to production cluster.

## 🩺 Health Check Verification
\`\`\`bash
curl -f https://api.sprintforge.dev/health
\`\`\`

## 🚨 Rollback Procedures
If error rates spike above 1%:
1. Trigger automatic rollback to previous stable tag:
   \`\`\`bash
   kubectl rollout undo deployment/api-server
   \`\`\`
2. Notify on-call engineering lead.
`,
  },
];

export function CreateWikiPageModal({
  isOpen,
  onClose,
  projectId,
  projectName = "TASKDEV",
  onPageCreated,
}: CreateWikiPageModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Document title is required");
      return;
    }

    const tpl = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];
    const initialContent = tpl.content(title.trim());
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      const { data: newDoc } = await wikiAPI.create({
        title: title.trim(),
        content: initialContent,
        project: projectId,
        tags: tags.length > 0 ? tags : tpl.tags,
      });
      toast.success("Documentation page created! 📄");
      onPageCreated(newDoc);
      onClose();
    } catch {
      toast.error("Failed to create page");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        {/* Backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-[#090d1f] border border-white/[0.12] rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-4 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Engineering Wiki
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono text-slate-400">{projectName}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Create Knowledge Page
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Scroll Area */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Page Title <span className="text-violet-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Architecture Overview, API Endpoints, or Setup Guide"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-sm focus:outline-none focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 transition-all font-medium placeholder:text-slate-600"
              />
            </div>

            {/* Template Selector Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Engineering Starter Template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TEMPLATES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = selectedTemplate === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTemplate(t.id);
                        if (!title) setTitle(t.title);
                        setTagsInput(t.tags.join(", "));
                      }}
                      className={cn(
                        "p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2",
                        isSelected
                          ? "bg-violet-600/15 border-violet-500/60 shadow-[0_0_20px_rgba(124,92,255,0.25)]"
                          : "bg-[#060914] border-white/[0.06] hover:bg-white/[0.03]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-xl flex items-center justify-center text-xs",
                            isSelected
                              ? "bg-violet-600 text-white"
                              : "bg-white/[0.04] text-slate-400"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white truncate">
                          {t.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {t.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tags & Topic Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. architecture, api, backend, runbook"
                className="w-full px-4 py-2 rounded-xl border border-white/[0.1] bg-[#060914] text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500/70 placeholder:text-slate-600 font-mono"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0b1026] flex items-center justify-between gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(124,92,255,0.4)] hover:shadow-[0_0_28px_rgba(124,92,255,0.6)] transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Document...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Page</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
