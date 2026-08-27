"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { wikiAPI } from "@/lib/api";
import { useProjectStore } from "@/lib/store/projectStore";
import { useAuthStore } from "@/lib/store/authStore";
import { getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { CreateWikiPageModal } from "@/components/wiki/CreateWikiPageModal";
import { WikiHomeView } from "@/components/wiki/WikiHomeView";
import { WikiDocumentView } from "@/components/wiki/WikiDocumentView";

export default function WikiPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentProject, fetchProject } = useProjectStore();
  const { user: currentUser } = useAuthStore();

  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProject(projectId);
    loadPages();
  }, [projectId]);

  const loadPages = async () => {
    try {
      setIsLoading(true);
      const { data } = await wikiAPI.getAll(projectId);
      setPages(data || []);
    } catch {
      toast.error("Failed to load wiki documentation");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setShowCreateModal(true);
      } else if (e.key === "Escape") {
        setShowCreateModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {isLoading ? (
        /* ── Loading Skeleton ── */
        <div className="space-y-6">
          <div className="h-28 bg-white/[0.02] border border-white/[0.04] rounded-3xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white/[0.02] border border-white/[0.04] rounded-3xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 bg-white/[0.02] border border-white/[0.04] rounded-3xl animate-pulse" />
        </div>
      ) : selectedPage ? (
        /* ── Document View & Editor ── */
        <WikiDocumentView
          page={selectedPage}
          pages={pages}
          projectId={projectId}
          onBackToHome={() => setSelectedPage(null)}
          onSelectPage={(p) => setSelectedPage(p)}
          onOpenCreate={() => setShowCreateModal(true)}
          onPageUpdated={(updated) => {
            setSelectedPage(updated);
            setPages((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
          }}
          onPageDeleted={(pageId) => {
            setPages((prev) => prev.filter((p) => p._id !== pageId));
            setSelectedPage(null);
          }}
        />
      ) : (
        /* ── Knowledge Hub Home View ── */
        <WikiHomeView
          pages={pages}
          projectName={currentProject?.name}
          onOpenCreate={() => setShowCreateModal(true)}
          onSelectPage={(p) => setSelectedPage(p)}
        />
      )}

      {/* ── Create Wiki Page Modal ── */}
      <CreateWikiPageModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        projectName={currentProject?.name}
        onPageCreated={(newPage) => {
          setPages((prev) => [newPage, ...prev]);
          setSelectedPage(newPage);
        }}
      />
    </div>
  );
}
