"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderKanban,
  TrendingUp,
  Users,
  KeyRound,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useProjectStore } from "@/lib/store/projectStore";
import toast from "react-hot-toast";

interface QuickActionsAndJoinProps {
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
}

export function QuickActionsAndJoin({
  onOpenNewTask,
  onOpenNewProject,
}: QuickActionsAndJoinProps) {
  const router = useRouter();
  const { joinWithCode } = useProjectStore();
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setIsJoining(true);
    try {
      const data = await joinWithCode(cleanCode);
      toast.success(data.message || "Joined project successfully! 🎉");
      setCode("");
      if (data.projectId) {
        router.push(`/dashboard/projects/${data.projectId}/board`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to join project. Invalid code.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Quick Actions Card ── */}
      <div className="p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white">Quick Actions</h3>

        <div className="grid grid-cols-2 gap-2">
          {/* New Task */}
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-violet-500/40 hover:bg-[#0c1228] transition-all text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            <Plus className="w-4 h-4 text-violet-400" />
            <span>New Task</span>
          </button>

          {/* New Project */}
          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-violet-500/40 hover:bg-[#0c1228] transition-all text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            <span>New Project</span>
          </button>

          {/* Analytics */}
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-emerald-500/40 hover:bg-[#0c1228] transition-all text-xs font-semibold text-slate-300 hover:text-white"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Analytics</span>
          </Link>

          {/* Team */}
          <Link
            href="/dashboard/team"
            className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-amber-500/40 hover:bg-[#0c1228] transition-all text-xs font-semibold text-slate-300 hover:text-white"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Team Hub</span>
          </Link>
        </div>
      </div>

      {/* ── Join via Code Card ── */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c1228] to-[#090d1f] border border-violet-500/20 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Join via Invite Code</h4>
            <p className="text-[10px] text-slate-400">Enter a 6-digit project code</p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. AAB76C"
            maxLength={6}
            className="flex-1 px-3 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-mono font-bold uppercase tracking-widest text-white placeholder:tracking-normal placeholder:text-slate-600 focus:outline-none focus:border-violet-500/70"
          />
          <button
            type="submit"
            disabled={isJoining || code.length < 3}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(124,92,255,0.3)] disabled:opacity-50 cursor-pointer flex items-center gap-1"
          >
            {isJoining ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>Join</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
