"use client";

import React from "react";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { generateAvatar, cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";

interface ProjectsGridCardProps {
  projects: any[];
  onOpenCreateProject: () => void;
}

export function ProjectsGridCard({ projects = [], onOpenCreateProject }: ProjectsGridCardProps) {
  return (
    <div className="p-5 rounded-3xl bg-[#090d1f] border border-white/[0.08] shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Active Projects</h3>
            <p className="text-[11px] text-slate-400">Software engineering workspaces</p>
          </div>
        </div>

        <button
          onClick={onOpenCreateProject}
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects List / Grid */}
      {projects.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#060914] border border-dashed border-white/[0.06] space-y-3">
          <FolderKanban className="w-8 h-8 text-violet-400 mx-auto opacity-60" />
          <div className="max-w-xs mx-auto">
            <h4 className="text-sm font-bold text-white">Your workspace is ready!</h4>
            <p className="text-xs text-slate-400 mt-1">
              Create your first project or join an existing team using a 6-digit invite code.
            </p>
          </div>
          <button
            onClick={onOpenCreateProject}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(124,92,255,0.35)] cursor-pointer"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => {
            const memberCount = project.members?.length || 1;
            return (
              <Link
                key={project._id}
                href={`/dashboard/projects/${project._id}/board`}
                className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-violet-500/40 hover:bg-[#0c1228] transition-all space-y-3 group shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold text-white shadow-sm"
                        style={{ backgroundColor: project.color || "#6366f1" }}
                      >
                        {project.key?.charAt(0) || "P"}
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                        {project.type || "SCRUM"}
                      </span>
                    </div>

                    {/* Health indicator */}
                    <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Healthy</span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-violet-200 transition-colors truncate">
                    {project.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
                    {project.description || "Engineering agile project"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
                  {/* Member avatars */}
                  <div className="flex items-center -space-x-1.5">
                    {project.members?.slice(0, 3).map((m: any, idx: number) => {
                      const user = m.user || m;
                      return (
                        <UserAvatar
                          key={idx}
                          src={user?.avatar}
                          name={user?.name || "Member"}
                          size="xs"
                          ringClassName="border border-[#090d1f]"
                        />
                      );
                    })}
                    {memberCount > 3 && (
                      <span className="text-[9px] font-mono text-slate-400 pl-2">
                        +{memberCount - 3}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-violet-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-bold">
                    <span>Board</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
