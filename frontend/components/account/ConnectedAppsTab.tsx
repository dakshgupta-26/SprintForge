"use client";

import React from "react";
import { useAuthStore } from "@/lib/store/authStore";
import {
  CheckCircle2,
  ExternalLink,
  Link2,
  Unlink,
  Shield,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export function ConnectedAppsTab() {
  const { user } = useAuthStore();

  const isGoogleConnected = Boolean(
    user?.provider === "google" || user?.providerId
  );
  const isGithubConnected = user?.provider === "github";
  const hasPasswordConfigured = Boolean(
    user?.hasPassword ?? (user?.provider === "local" || !user?.providerId)
  );

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <Link2 className="w-4 h-4 text-violet-400" />
            Connected Accounts & Developer Tools
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect third-party platforms to streamline Single Sign-On (SSO), profile synchronization, and project workflows.
          </p>
        </div>

        <div className="space-y-3.5">
          {/* Google Workspace */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white">Google Workspace / Account</p>
                  {isGoogleConnected ? (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 px-2 py-0.2 rounded-full bg-slate-800 border border-slate-700">
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isGoogleConnected
                    ? `Linked to ${user?.email} • Single Sign-On and profile sync active`
                    : "Connect your Google account for passwordless Single Sign-On"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
              {isGoogleConnected ? (
                <span className="text-xs font-mono text-slate-300 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  Primary SSO Provider
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    toast("Google SSO link is available from the login and registration screens.", {
                      icon: "🔗",
                    })
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
                >
                  Connect Google
                </button>
              )}
            </div>
          </div>

          {/* GitHub */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center flex-shrink-0 text-white">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white">GitHub</p>
                  {isGithubConnected && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Repository commit linking, automated branch triggers, and issue sync
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                toast("GitHub App integration ready for workspace linking.", {
                  icon: "🐙",
                })
              }
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-white transition-colors cursor-pointer self-end sm:self-center flex-shrink-0"
            >
              {isGithubConnected ? "Manage" : "Connect GitHub"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

