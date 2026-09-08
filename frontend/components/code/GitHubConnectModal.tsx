"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Lock,
  Globe,
  Star,
  GitBranch,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Key,
} from "lucide-react";
import { GitHubIcon } from "@/components/shared/GitHubIcon";
import { codeAPI } from "@/lib/api";
import { useCodeStore } from "@/lib/store/codeStore";
import { cn } from "@/lib/utils";

export function GitHubConnectModal() {
  const {
    projectId,
    githubModalOpen,
    setGithubModalOpen,
    initWorkspace,
  } = useCodeStore();

  const [activeTab, setActiveTab] = useState<"picker" | "connect" | "url">("picker");
  const [ghStatus, setGhStatus] = useState<any>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [patToken, setPatToken] = useState("");
  const [cloneUrlInput, setCloneUrlInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloneStage, setCloneStage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatusAndRepos = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data: statusData } = await codeAPI.getGitHubStatus();
      setGhStatus(statusData);

      if (statusData.connected) {
        const { data: reposData } = await codeAPI.listGitHubRepos(1, searchQuery);
        setRepositories(reposData.repositories || []);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (githubModalOpen) {
      loadStatusAndRepos();
    }
  }, [githubModalOpen, searchQuery]);

  if (!githubModalOpen) return null;

  const handleConnectOAuth = async () => {
    try {
      const { data } = await codeAPI.getGitHubAuthUrl();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMessage("GitHub OAuth client credentials are not configured in backend .env.");
    }
  };

  const handleConnectToken = async () => {
    if (!patToken.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await codeAPI.connectGitHubToken(patToken.trim());
      setPatToken("");
      await loadStatusAndRepos();
      setActiveTab("picker");
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Invalid personal access token.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await codeAPI.disconnectGitHub();
      await loadStatusAndRepos();
    } catch {}
    setLoading(false);
  };

  const handleCloneRepo = async (repo: any) => {
    if (!projectId) return;
    setCloning(true);
    setErrorMessage(null);
    setCloneStage("Authenticating repository access...");

    try {
      setCloneStage("Cloning repository files into workspace...");
      await codeAPI.cloneGitHubRepo(projectId, {
        repoUrl: repo.cloneUrl || repo.htmlUrl,
        repoName: repo.name,
        owner: repo.owner,
        isPrivate: repo.isPrivate,
        defaultBranch: repo.defaultBranch,
      });

      setCloneStage("Indexing workspace files...");
      await initWorkspace(projectId);

      setCloneStage("Workspace ready!");
      setTimeout(() => {
        setCloning(false);
        setGithubModalOpen(false);
      }, 500);
    } catch (err: any) {
      setCloning(false);
      setErrorMessage(err.response?.data?.message || "Failed to clone repository.");
    }
  };

  const handleCloneCustomUrl = async () => {
    if (!cloneUrlInput.trim() || !projectId) return;
    const name = cloneUrlInput.split("/").pop()?.replace(".git", "") || "repo";
    await handleCloneRepo({
      cloneUrl: cloneUrlInput.trim(),
      name,
      owner: "custom",
      isPrivate: false,
      defaultBranch: "main",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none text-xs">
      <div
        className="w-full max-w-2xl bg-[#090d20] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0a0e24]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <GitHubIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Connect GitHub Repository
              </h3>
              <p className="text-[11px] text-slate-400">
                Import and synchronize public or private Git repositories
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGithubModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="px-5 border-b border-white/[0.08] flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("picker")}
            className={cn(
              "py-3 border-b-2 transition-colors cursor-pointer",
              activeTab === "picker"
                ? "border-violet-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            Your Repositories
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={cn(
              "py-3 border-b-2 transition-colors cursor-pointer",
              activeTab === "url"
                ? "border-violet-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            Paste Repository URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("connect")}
            className={cn(
              "py-3 border-b-2 transition-colors cursor-pointer",
              activeTab === "connect"
                ? "border-violet-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            GitHub Account Settings
          </button>
        </div>

        {/* ── Error Banner ── */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── Cloning Overlay ── */}
        {cloning && (
          <div className="p-8 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">
                Initializing Workspace
              </h4>
              <p className="text-xs text-slate-400 font-mono">{cloneStage}</p>
            </div>
          </div>
        )}

        {/* ── Tab Content ── */}
        {!cloning && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* 1. Repository Picker Tab */}
            {activeTab === "picker" && (
              <>
                {!ghStatus?.connected ? (
                  <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.08] space-y-3">
                    <GitHubIcon className="w-10 h-10 text-slate-500 mx-auto" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        GitHub Not Connected
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        Connect your GitHub account or Personal Access Token to browse and clone your private and public repositories.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("connect")}
                        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Connect GitHub Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("url")}
                        className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Paste Public URL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your repositories..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {loading ? (
                      <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                        <span>Fetching repositories from GitHub...</span>
                      </div>
                    ) : repositories.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        No repositories found
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                        {repositories.map((repo) => (
                          <div
                            key={repo.id}
                            className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/40 hover:bg-white/[0.04] transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-white truncate">
                                  {repo.fullName}
                                </span>
                                {repo.isPrivate ? (
                                  <span className="flex items-center gap-1 text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                    <Lock className="w-2.5 h-2.5" />
                                    Private
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    <Globe className="w-2.5 h-2.5" />
                                    Public
                                  </span>
                                )}
                              </div>

                              {repo.description && (
                                <p className="text-[11px] text-slate-400 truncate">
                                  {repo.description}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                                <span>{repo.language}</span>
                                <span className="flex items-center gap-1">
                                  <GitBranch className="w-2.5 h-2.5" />
                                  {repo.defaultBranch}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-2.5 h-2.5" />
                                  {repo.stargazersCount}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCloneRepo(repo)}
                              className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white font-semibold text-xs border border-violet-500/30 transition-all cursor-pointer flex-shrink-0"
                            >
                              Import
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* 2. Custom URL Tab */}
            {activeTab === "url" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Repository Clone URL
                  </label>
                  <input
                    type="text"
                    value={cloneUrlInput}
                    onChange={(e) => setCloneUrlInput(e.target.value)}
                    placeholder="https://github.com/owner/repository.git"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter any public GitHub repository URL, or a private repository if your GitHub account is connected.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloneCustomUrl}
                  disabled={!cloneUrlInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-40"
                >
                  Clone into Workspace
                </button>
              </div>
            )}

            {/* 3. Account Settings Tab */}
            {activeTab === "connect" && (
              <div className="space-y-5">
                {ghStatus?.connected ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={ghStatus.info?.avatarUrl || "https://github.com/github.png"}
                          alt="GitHub Avatar"
                          className="w-10 h-10 rounded-full border border-white/[0.1]"
                        />
                        <div>
                          <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <span>{ghStatus.info?.displayName || ghStatus.info?.username}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          </h4>
                          <span className="text-[11px] font-mono text-slate-400">
                            @{ghStatus.info?.username}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-white/[0.06]">
                      Scopes: {ghStatus.info?.scopes?.join(", ") || "repo, read:user"}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* OAuth Flow */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                      <h4 className="text-xs font-semibold text-white">
                        Connect with GitHub OAuth
                      </h4>
                      <p className="text-xs text-slate-400">
                        Authorize SprintForge to securely access your repositories without exposing credentials.
                      </p>
                      <button
                        type="button"
                        onClick={handleConnectOAuth}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <GitHubIcon className="w-4 h-4" />
                        <span>Authorize with GitHub</span>
                      </button>
                    </div>

                    {/* Or Personal Access Token */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                      <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                        <Key className="w-4 h-4 text-violet-400" />
                        <span>Or Connect with Personal Access Token</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Generate a GitHub Classic Token or Fine-Grained Token with <code className="text-violet-300 font-mono">repo</code> scope.
                      </p>
                      <input
                        type="password"
                        value={patToken}
                        onChange={(e) => setPatToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleConnectToken}
                        disabled={!patToken.trim() || loading}
                        className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-semibold text-xs transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        Save & Connect Token
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
