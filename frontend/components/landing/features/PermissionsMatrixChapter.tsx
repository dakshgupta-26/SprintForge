"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Key,
  Check,
  X,
  Users,
  Shield,
  Eye,
  Settings,
  Sparkles,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface RoleDef {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  summary: string;
  permissions: {
    title: string;
    granted: boolean;
    category: "admin" | "sprint" | "code" | "view";
  }[];
}

const roles: RoleDef[] = [
  {
    id: "admin",
    name: "Owner / Admin",
    badge: "Full Access",
    badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    summary: "Full workspace governance, member provisioning, billing, and API key management.",
    permissions: [
      { title: "Create & delete workspaces and projects", granted: true, category: "admin" },
      { title: "Manage roles, invite members & revoke access", granted: true, category: "admin" },
      { title: "Configure AI velocity & risk parameters", granted: true, category: "sprint" },
      { title: "Approve sprint releases & trigger production deploys", granted: true, category: "code" },
      { title: "View private burndown & compensation logs", granted: true, category: "view" },
    ],
  },
  {
    id: "pm",
    name: "Project Manager",
    badge: "Scope Governance",
    badgeColor: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    summary: "Sprint roadmap planning, capacity allocation, ticket triage, and timeline management.",
    permissions: [
      { title: "Create & delete workspaces and projects", granted: false, category: "admin" },
      { title: "Manage roles, invite members & revoke access", granted: true, category: "admin" },
      { title: "Configure AI velocity & risk parameters", granted: true, category: "sprint" },
      { title: "Approve sprint releases & trigger production deploys", granted: true, category: "code" },
      { title: "View private burndown & compensation logs", granted: false, category: "view" },
    ],
  },
  {
    id: "dev",
    name: "Core Developer",
    badge: "Execution",
    badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    summary: "Active task execution, branch linking, pull request reviews, and team chat participation.",
    permissions: [
      { title: "Create & delete workspaces and projects", granted: false, category: "admin" },
      { title: "Manage roles, invite members & revoke access", granted: false, category: "admin" },
      { title: "Configure AI velocity & risk parameters", granted: false, category: "sprint" },
      { title: "Approve sprint releases & trigger production deploys", granted: true, category: "code" },
      { title: "View private burndown & compensation logs", granted: false, category: "view" },
    ],
  },
  {
    id: "guest",
    name: "Guest / Auditor",
    badge: "Read Only",
    badgeColor: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    summary: "View-only access for external clients, auditors, or stakeholders.",
    permissions: [
      { title: "Create & delete workspaces and projects", granted: false, category: "admin" },
      { title: "Manage roles, invite members & revoke access", granted: false, category: "admin" },
      { title: "Configure AI velocity & risk parameters", granted: false, category: "sprint" },
      { title: "Approve sprint releases & trigger production deploys", granted: false, category: "code" },
      { title: "View private burndown & compensation logs", granted: false, category: "view" },
    ],
  },
];

export function PermissionsMatrixChapter() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [selectedRole, setSelectedRole] = useState<string>("admin");

  const currentRole = roles.find((r) => r.id === selectedRole) || roles[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      {/* Background glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[110px] pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Story Copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-pink-400" /> Chapter 05 · Governance
          </div>

          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight font-display">
            Granular Permissions & Enterprise RBAC
          </h3>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            Explicit workspace governance designed for fast-growing engineering organizations. Delegate authority with precision without compromising repo security.
          </p>

          {/* Interactive Role Switcher Tabs */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Select Role to Inspect Privileges
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
              {roles.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? "bg-violet-950/40 border-violet-500/50 shadow-md ring-1 ring-violet-500/30"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-300"}`}>
                        {r.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{r.badge}</div>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-violet-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Right Permission Matrix Canvas */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 rounded-3xl bg-[#090d1a]/95 border border-pink-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-2xl p-6 sm:p-8 relative"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.08] mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <span>{currentRole.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentRole.badgeColor}`}>
                    {currentRole.badge}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{currentRole.summary}</div>
              </div>
            </div>
          </div>

          {/* Permissions Checklist */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRole.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-2.5"
              >
                {currentRole.permissions.map((perm, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs transition-colors ${
                      perm.granted
                        ? "bg-[#060914] border-white/[0.08]"
                        : "bg-white/[0.01] border-white/[0.03] opacity-60"
                    }`}
                  >
                    <span className={`font-medium ${perm.granted ? "text-slate-200" : "text-slate-500"}`}>
                      {perm.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {perm.granted ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Granted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                          <X className="w-3 h-3" /> Restricted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Security Guarantee Footer */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Key className="w-3.5 h-3.5 text-violet-400" />
              <span>SAML 2.0 & SCIM Provisioning Supported</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400">Audit Log v2.4 Active</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
