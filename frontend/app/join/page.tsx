"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { projectAPI } from "@/lib/api";
import {
  Sparkles, Loader2, ArrowRight, KeyRound, CheckCircle2, AlertTriangle,
  LogIn, UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Inner component (uses useSearchParams which needs Suspense) ──────────────
function JoinPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, initialize, isLoading: authLoading } = useAuthStore();

  const [code, setCode] = useState(searchParams.get("code") || "");
  const [isJoining, setIsJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // If token param is present, redirect to the invite page
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) router.replace(`/invite/${token}`);
  }, [searchParams, router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setIsJoining(true);
    try {
      // Try invite code first (email-matched, single use)
      const { data } = await projectAPI.acceptByCode(code.trim().toUpperCase());
      setProjectId(data.projectId);
      setJoined(true);
      toast.success("Joined the project! 🎉");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "";
      // If it's not a personal invite code, try the project-wide join code
      if (err?.response?.status === 404) {
        try {
          const { data } = await projectAPI.joinWithCode(code.trim().toUpperCase());
          setProjectId(data.projectId);
          setJoined(true);
          toast.success("Joined the project! 🎉");
        } catch (err2: any) {
          setError(err2?.response?.data?.message || "Invalid or expired code. Double-check and try again.");
        }
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoToProject = () => {
    if (projectId) router.push(`/dashboard/projects/${projectId}/board`);
    else router.push("/dashboard/projects");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-background items-center justify-center p-12">
        {/* Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight">SprintForge</span>
          </div>

          <h2 className="text-4xl font-black leading-tight mb-6">
            Join your team and
            <br />
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              start building.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            Enter your invite code to join a project and start collaborating with your team instantly.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {[
              "Works with email invite codes",
              "Works with project join codes",
              "Secure & email-verified",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black">SprintForge</span>
          </div>

          <AnimatePresence mode="wait">
            {joined ? (
              /* ── Success state ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-3xl p-8 text-center shadow-2xl"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-2xl font-black text-foreground mb-3">You're in! 🎉</h1>
                <p className="text-muted-foreground text-sm mb-8">
                  You've successfully joined the project. Ready to start collaborating?
                </p>
                <button
                  onClick={handleGoToProject}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-95"
                >
                  Go to Project Board <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : !isAuthenticated ? (
              /* ── Not logged in ── */
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-black text-foreground mb-2">Join a Project</h1>
                  <p className="text-sm text-muted-foreground">
                    Sign in to use your invite code and join a project
                  </p>
                </div>

                {/* Show the code they typed so it persists after login */}
                {code && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Your code</p>
                    <p className="text-2xl font-black font-mono tracking-widest text-primary">{code}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Link
                    href={`/login?next=${encodeURIComponent(`/join${code ? `?code=${code}` : ""}`)}`}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-95"
                  >
                    <LogIn className="w-4 h-4" /> Log in to join
                  </Link>
                  <Link
                    href={`/signup?next=${encodeURIComponent(`/join${code ? `?code=${code}` : ""}`)}`}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-all active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" /> Create an account
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* ── Logged in — show the code form ── */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-black text-foreground mb-2">Join a Project</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter the invite code from your email or from a team member
                  </p>
                </div>

                <form onSubmit={handleJoin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Invite Code
                    </label>
                    <input
                      id="invite-code-input"
                      type="text"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                        setError(null);
                      }}
                      placeholder="e.g. ABC123"
                      maxLength={8}
                      required
                      autoFocus
                      className="w-full px-4 py-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-2xl font-black font-mono tracking-[0.3em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-500">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    id="join-project-btn"
                    type="submit"
                    disabled={isJoining || code.trim().length < 4}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isJoining ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Join Project <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Logged in as */}
                <div className="mt-6 pt-5 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Joining as{" "}
                    <span className="font-semibold text-foreground">{user?.email}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Page export (wraps inner in Suspense for useSearchParams) ────────────────
export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <JoinPageInner />
    </Suspense>
  );
}
