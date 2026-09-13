"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  X,
  Trash2,
  Loader2,
  ShieldCheck,
  Check,
  Info,
} from "lucide-react";
import { useProjectStore } from "@/lib/store/projectStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface ProjectDeleteModalProps {
  isOpen?: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
  project?: { _id: string; name: string; [key: string]: any };
  onSuccess?: () => void;
}

export function ProjectDeleteModal({
  isOpen = true,
  onClose,
  projectId,
  projectName,
  project,
  onSuccess,
}: ProjectDeleteModalProps) {
  const router = useRouter();
  const { deleteProject } = useProjectStore();
  const [typedName, setTypedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const targetProjectId = projectId || project?._id || "";
  const targetProjectName = projectName || project?.name || "";

  if (!isOpen) return null;

  const isMatch = typedName.trim() === targetProjectName.trim();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteProject(targetProjectId, targetProjectName);
      toast.success(`Project "${targetProjectName}" was permanently deleted`);
      onClose();
      onSuccess?.();
      router.push("/dashboard/projects");
    } catch (err: any) {
      setIsDeleting(false);
      toast.error(err?.response?.data?.message || "Failed to delete project");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={!isDeleting ? onClose : undefined}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#0a0d1e] border border-rose-500/30 rounded-3xl shadow-2xl z-10 overflow-hidden"
        >
          {/* Danger Top Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-red-500 to-rose-600" />

          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0c1024] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Project</h3>
                <p className="text-[11px] text-rose-300/80 font-mono">Permanent destructive action</p>
              </div>
            </div>
            {!isDeleting && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <form onSubmit={handleDelete} className="p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                Delete &ldquo;{projectName}&rdquo;?
              </h4>
              <p className="text-xs text-slate-300">
                This will permanently delete the project and all its associated engineering resources:
              </p>
            </div>

            {/* List of deleted items */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#060914] border border-white/[0.06] text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Project & settings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Boards & backlog</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Tasks & comments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Sprints & velocity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Issues & triage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Project chat & files</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Calls & recordings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Code workspace</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Analytics & impact</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Wiki documents</span>
              </div>
            </div>

            {/* GitHub and Account Safety Reassurance Banner */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] space-y-0.5">
                <p className="font-semibold text-emerald-200">Your External Repos & Account are Safe</p>
                <p className="text-emerald-300/80">
                  Deleting this project will <strong>never</strong> delete or modify your GitHub repository,
                  your SprintForge user account, or other projects.
                </p>
              </div>
            </div>

            {/* Confirmation Typing Prompt */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-300">
                To confirm, type{" "}
                <span className="font-mono font-bold text-white bg-white/[0.08] px-1.5 py-0.5 rounded border border-white/[0.12] select-all">
                  {projectName}
                </span>{" "}
                below:
              </label>
              <input
                type="text"
                autoFocus
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={projectName}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060914] border border-white/[0.1] focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm font-mono text-white placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isMatch || isDeleting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Project...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete Project</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
