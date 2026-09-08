"use client";

import React from "react";
import { Users, Shield, FileCode, ExternalLink, Sparkles, Circle } from "lucide-react";
import { useCodeStore, CodeCollaborator } from "@/lib/store/codeStore";
import { useAuthStore } from "@/lib/store/authStore";
import { cn, generateAvatar } from "@/lib/utils";

export function CollaborationPanel() {
  const { collaborators, openFile, permission } = useCodeStore();
  const { user } = useAuthStore();

  return (
    <div className="h-full flex flex-col bg-[#070a18] select-none text-slate-300">
      {/* ── Top Header ── */}
      <div className="h-10 px-3 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#070a18]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Collaborators ({collaborators.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-[10px] font-mono text-violet-300 font-bold">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>{permission}</span>
        </div>
      </div>

      {/* ── Active Members List ── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
        {collaborators.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            <p>Connecting to collaboration network...</p>
          </div>
        ) : (
          collaborators.map((collab) => {
            const isMe = collab.userId === user?._id;

            return (
              <div
                key={collab.userId}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* User Avatar with Color Dot */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: collab.color || "#8b5cf6" }}
                      >
                        {collab.avatar ? (
                          <img
                            src={collab.avatar}
                            alt={collab.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          collab.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#070a18]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">
                          {collab.name}
                        </span>
                        {isMe && (
                          <span className="text-[9px] font-mono text-violet-300 bg-violet-500/20 px-1 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-mono font-medium"
                        style={{ color: collab.color }}
                      >
                        Active Collaborator
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active File State */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.04]">
                  {collab.activeFile ? (
                    <button
                      type="button"
                      onClick={() => openFile(collab.activeFile!)}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-violet-300 transition-colors truncate text-left"
                      title={`Open ${collab.activeFile}`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                      <span className="truncate">{collab.activeFile}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </button>
                  ) : (
                    <span className="text-slate-500 italic">Browsing workspace</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
