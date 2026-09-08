"use client";

import React, { useState, useEffect } from "react";
import { Shield, X, Check, ShieldCheck, Loader2, Info } from "lucide-react";
import { codeAPI } from "@/lib/api";
import { useCodeStore } from "@/lib/store/codeStore";
import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";

export function CodePermissionsModal() {
  const {
    projectId,
    permissionsModalOpen,
    setPermissionsModalOpen,
    permission: myPermission,
  } = useCodeStore();
  const { user } = useAuthStore();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadPermissions = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await codeAPI.getCodePermissions(projectId);
      setMembers(data.members || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissionsModalOpen) {
      loadPermissions();
    }
  }, [permissionsModalOpen, projectId]);

  if (!permissionsModalOpen) return null;

  const canManage = myPermission === "WRITE";

  const handleUpdatePermission = async (userId: string, newPerm: string) => {
    if (!projectId || !canManage) return;
    setUpdatingId(userId);
    try {
      await codeAPI.updateCodePermission(projectId, userId, newPerm);
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, codePermission: newPerm } : m))
      );
    } catch {
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none text-xs">
      <div
        className="w-full max-w-xl bg-[#090d20] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0a0e24]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Workspace Code Permissions
              </h3>
              <p className="text-[11px] text-slate-400">
                Control member access to collaborative editing, Git commits, and terminal execution
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPermissionsModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Permission Descriptions ── */}
        <div className="px-5 py-3 bg-[#080b1c] border-b border-white/[0.06] flex items-start gap-2 text-[11px] text-slate-400">
          <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p>
              <strong className="text-slate-200">VIEW:</strong> Read-only access to files and diffs.
            </p>
            <p>
              <strong className="text-slate-200">EDIT:</strong> Real-time collaborative code editing.
            </p>
            <p>
              <strong className="text-slate-200">WRITE:</strong> Edit, commit, push, branch, and execute commands in terminal.
            </p>
          </div>
        </div>

        {/* ── Members List ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2 scrollbar-thin">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span>Loading workspace permissions...</span>
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.userId}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {member.name?.charAt(0).toUpperCase() || "M"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white truncate">
                        {member.name}
                      </span>
                      {member.isOwner && (
                        <span className="text-[9px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                          Owner
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 truncate block font-mono">
                      {member.email}
                    </span>
                  </div>
                </div>

                {/* Role Picker or Badge */}
                {member.isOwner || !canManage ? (
                  <span className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono font-bold text-violet-300">
                    {member.codePermission || "WRITE"}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {updatingId === member.userId && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                    )}
                    <select
                      value={member.codePermission || "EDIT"}
                      onChange={(e) =>
                        handleUpdatePermission(member.userId, e.target.value)
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#0c1024] border border-white/[0.12] text-xs text-white font-mono font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value="VIEW">VIEW</option>
                      <option value="EDIT">EDIT</option>
                      <option value="WRITE">WRITE</option>
                    </select>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
