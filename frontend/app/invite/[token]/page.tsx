"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { projectAPI } from "@/lib/api";
import { Sparkles, Loader2, ArrowRight, ShieldCheck, Mail, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();
  
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const { data } = await projectAPI.getInviteInfo(token);
        setInviteData(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Invalid or expired invitation link.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) return;
    setIsAccepting(true);
    try {
      const { data } = await projectAPI.acceptInvite(token);
      toast.success(data.message || "Welcome to the project! 🎉");
      router.push(`/dashboard/projects/${data.projectId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to accept invitation");
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm font-medium">Validating invitation...</p>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-black mb-2 text-center text-foreground">Invitation Invalid</h1>
        <p className="text-muted-foreground max-w-md text-center">{error}</p>
        <Link 
          href="/" 
          className="mt-8 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all"
        >
          Return Home
        </Link>
      </div>
    );
  }

  // Handle wrong user logged in
  const isWrongUser = isAuthenticated && user && inviteData && user.email.toLowerCase() !== inviteData.email.toLowerCase();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-background items-center justify-center p-12">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black">SprintForge</span>
          </div>
          <h2 className="text-4xl font-black leading-tight mb-4">
            Join your team and start <span className="gradient-text">building.</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            SprintForge gives agile teams the power to plan, track, and ship high-quality products faster.
          </p>
        </div>
      </div>

      {/* Right — form/action */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl p-8 relative overflow-hidden"
        >
          {/* Subtle gradient glow in card */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8">
            <div 
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg mb-4"
              style={{ background: inviteData.project?.color || "#6366f1" }}
            >
              {inviteData.project?.name?.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">
              You've been invited!
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{inviteData.inviter?.name}</strong> has invited you to collaborate on the project 
              <br />
              <strong className="text-foreground">{inviteData.project?.name}</strong>.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5 uppercase font-bold tracking-wider">Assigned Role</p>
                <p className="text-sm font-semibold text-foreground capitalize">{inviteData.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5 uppercase font-bold tracking-wider">Invited Email</p>
                <p className="text-sm font-semibold text-foreground truncate">{inviteData.email}</p>
              </div>
            </div>
          </div>

          {/* Action section based on Auth state */}
          {!isAuthenticated ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground text-center mb-4">
                Sign in to accept your invitation
              </h3>
              <Link 
                href={`/signup?email=${encodeURIComponent(inviteData.email)}&next=${encodeURIComponent(`/invite/${token}`)}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-95"
              >
                Create a free account <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-center mt-4">
                <span className="text-xs text-muted-foreground">Already have an account? </span>
                <Link 
                  href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} 
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Log in
                </Link>
              </div>
            </div>
          ) : isWrongUser ? (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-center space-y-3">
              <p className="text-sm text-red-500 font-medium">
                You are logged in as {user?.email}, but this invite is for {inviteData.email}.
              </p>
              <button 
                onClick={() => {
                  useAuthStore.getState().logout?.();
                  window.location.reload();
                }}
                className="px-4 py-2 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Log out & Switch accounts
              </button>
            </div>
          ) : (
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60"
            >
              {isAccepting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Accept Invitation & Join Project"}
            </button>
          )}

        </motion.div>
      </div>
    </div>
  );
}
