"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { codeAPI } from "@/lib/api";
import {
  CheckCircle2,
  ExternalLink,
  Link2,
  Unlink,
  Loader2,
  Key,
  Shield,
  AlertTriangle,
  X,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export function ConnectedAppsTab() {
  const { user } = useAuthStore();

  const isGoogleConnected = Boolean(
    user?.provider === "google" || user?.providerId
  );

  const [ghStatus, setGhStatus] = useState<{
    connected: boolean;
    info?: {
      username: string;
      displayName?: string;
      avatarUrl?: string;
      profileUrl?: string;
      repositoryCount?: number;
      installationUrl?: string;
      connectedAt?: string;
    } | null;
  }>({ connected: false, info: null });

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // PAT Fallback modal
  const [patModalOpen, setPatModalOpen] = useState(false);
  const [patToken, setPatToken] = useState("");
  const [patSubmitting, setPatSubmitting] = useState(false);

  const fetchStatus = async () => {
    try {
      const { data } = await codeAPI.getGitHubStatus();
      setGhStatus({
        connected: Boolean(data?.connected),
        info: data?.info || null,
      });
    } catch {
      setGhStatus({ connected: false, info: null });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Check URL for OAuth callback code or error redirect on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const githubStatus = urlParams.get("github");
    const githubError = urlParams.get("github_error");

    if (code) {
      setIsConnecting(true);
      codeAPI
        .handleGitHubCallback(code)
        .then((res) => {
          toast.success(`Connected to GitHub as @${res.data.username}`);
          fetchStatus();
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || "Failed to link GitHub account");
        })
        .finally(() => {
          setIsConnecting(false);
          // Clean up URL query parameters without full reload
          const cleanUrl = window.location.pathname + (urlParams.get("tab") ? "?tab=apps" : "");
          window.history.replaceState({}, document.title, cleanUrl);
        });
    } else if (githubStatus === "connected") {
      toast.success("GitHub account connected successfully!");
      fetchStatus();
      const cleanUrl = window.location.pathname + (urlParams.get("tab") ? "?tab=apps" : "");
      window.history.replaceState({}, document.title, cleanUrl);
    } else if (githubError) {
      toast.error(decodeURIComponent(githubError));
      const cleanUrl = window.location.pathname + (urlParams.get("tab") ? "?tab=apps" : "");
      window.history.replaceState({}, document.title, cleanUrl);
      fetchStatus();
    } else {
      fetchStatus();
    }
  }, []);

  const handleConnectOAuth = async () => {
    setIsConnecting(true);
    try {
      const { data } = await codeAPI.getGitHubAuthUrl();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setPatModalOpen(true);
      }
    } catch {
      // If backend OAuth credentials are not configured yet, fallback to PAT
      setPatModalOpen(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectPAT = async () => {
    if (!patToken.trim()) return;
    setPatSubmitting(true);
    try {
      const { data } = await codeAPI.connectGitHubToken(patToken.trim());
      toast.success(`Connected as @${data.username}`);
      setPatToken("");
      setPatModalOpen(false);
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid GitHub token");
    } finally {
      setPatSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await codeAPI.disconnectGitHub();
      toast.success("GitHub account disconnected");
      setDisconnectModalOpen(false);
      await fetchStatus();
    } catch {
      toast.error("Failed to disconnect GitHub account");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <Link2 className="w-4 h-4 text-violet-400" />
            Connected Accounts & Developer Tools
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect third-party platforms to streamline Single Sign-On (SSO), profile synchronization, and Git workflows.
          </p>
        </div>

        <div className="space-y-3.5">
          {/* ── Google Workspace Card ── */}
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

          {/* ── Real GitHub App Integration Card ── */}
          <div className="p-4 rounded-2xl bg-[#060914] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            {isLoadingStatus ? (
              <div className="flex items-center gap-3.5 py-2">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-32 bg-white/[0.08] rounded animate-pulse" />
                  <div className="h-2 w-64 bg-white/[0.04] rounded animate-pulse" />
                </div>
              </div>
            ) : ghStatus.connected && ghStatus.info ? (
              /* ── CONNECTED STATE ── */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    {ghStatus.info.avatarUrl ? (
                      <img
                        src={ghStatus.info.avatarUrl}
                        alt={ghStatus.info.username}
                        className="w-10 h-10 rounded-xl border border-white/[0.12] object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#060914]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">GitHub</p>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                      <span className="text-[11px] font-mono text-violet-300 font-semibold truncate">
                        @{ghStatus.info.username}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Repositories available: <strong className="text-white font-mono">{ghStatus.info.repositoryCount ?? 0}</strong></span>
                      {ghStatus.info.connectedAt && (
                        <span className="text-slate-500 text-[10px]">
                          • Connected {new Date(ghStatus.info.connectedAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap flex-shrink-0 self-end sm:self-center">
                  <a
                    href={ghStatus.info.profileUrl || `https://github.com/${ghStatus.info.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Open GitHub</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  {ghStatus.info.installationUrl && (
                    <a
                      href={ghStatus.info.installationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Manage Access
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setDisconnectModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold text-red-400 transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              /* ── DISCONNECTED STATE ── */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center flex-shrink-0 text-white">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">GitHub</p>
                      <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                        Not Connected
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Connect your GitHub account to access repositories directly inside SprintForge.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setPatModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Connect using Personal Access Token"
                  >
                    Use Token
                  </button>

                  <button
                    type="button"
                    onClick={handleConnectOAuth}
                    disabled={isConnecting}
                    className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <span>Connect GitHub</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Disconnect Confirmation Modal (Section 32) ── */}
      <AnimatePresence>
        {disconnectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-[#0a0e24] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Disconnect GitHub?</h4>
                  <p className="text-[11px] text-slate-400">This action will unlink your GitHub authorization.</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                SprintForge will no longer be able to access your GitHub repositories. Existing imported project workspace data will remain safe.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDisconnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDisconnecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Disconnecting...</span>
                    </>
                  ) : (
                    <span>Disconnect</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PAT Fallback Modal ── */}
      <AnimatePresence>
        {patModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-[#0a0e24] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Key className="w-4 h-4 text-violet-400" />
                  <h4 className="text-sm font-bold">Connect Personal Access Token</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setPatModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Provide a GitHub Personal Access Token (classic or fine-grained) with <code className="text-violet-300 font-mono">repo</code> permissions to access your public and private repositories.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400">Token (ghp_... or github_pat_...)</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={patToken}
                    onChange={(e) => setPatToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConnectPAT}
                  disabled={!patToken.trim() || patSubmitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {patSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Save & Connect</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
