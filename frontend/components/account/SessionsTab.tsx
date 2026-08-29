"use client";

import React, { useState, useEffect } from "react";
import {
  Laptop,
  Smartphone,
  Tablet,
  ShieldCheck,
  LogOut,
  Clock,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface SessionItem {
  sessionId: string;
  browser: string;
  os: string;
  deviceType: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export function SessionsTab() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const { data } = await authAPI.getSessions();
      setSessions(data || []);
    } catch (err: any) {
      toast.error("Failed to load active sessions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await authAPI.revokeSession(sessionId);
      toast.success("Session revoked successfully");
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOthers = async () => {
    setIsRevokingOthers(true);
    try {
      await authAPI.revokeOtherSessions();
      toast.success("All other active sessions have been revoked.");
      setSessions((prev) => prev.filter((s) => s.isCurrent));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to revoke other sessions");
    } finally {
      setIsRevokingOthers(false);
    }
  };

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === "mobile") return <Smartphone className="w-5 h-5" />;
    if (deviceType === "tablet") return <Tablet className="w-5 h-5" />;
    return <Laptop className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
              Active Browser & Device Sessions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Devices currently authenticated to your SprintForge account with rotating refresh tokens.
            </p>
          </div>

          {otherSessions.length > 0 && (
            <button
              type="button"
              onClick={handleRevokeOthers}
              disabled={isRevokingOthers}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 text-xs font-semibold text-slate-300 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
            >
              {isRevokingOthers && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Sign out all other devices</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500 mb-2" />
            <p className="text-xs">Loading active sessions...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Active Session */}
            {currentSession && (
              <div className="p-4 rounded-2xl bg-[#060914] border border-violet-500/40 shadow-[0_0_20px_rgba(124,92,255,0.08)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                    {getDeviceIcon(currentSession.deviceType)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white truncate">
                        {currentSession.os} • {currentSession.browser}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        This Device
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>Active now</span>
                      <span>•</span>
                      <span>IP: {currentSession.ipAddress}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <ShieldCheck className="w-3.5 h-3.5" /> Secure Session
                  </span>
                </div>
              </div>
            )}

            {/* Other Active Sessions */}
            {otherSessions.length > 0 ? (
              <div className="space-y-2.5 pt-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Other Active Devices ({otherSessions.length})
                </h4>
                {otherSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {session.os} • {session.browser}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>
                            Last active{" "}
                            {formatDistanceToNow(new Date(session.lastActiveAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <span>•</span>
                          <span>IP: {session.ipAddress}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRevokeSession(session.sessionId)}
                      disabled={revokingId === session.sessionId}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                    >
                      {revokingId === session.sessionId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5" />
                      )}
                      <span>Revoke</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              !currentSession && (
                <div className="p-4 rounded-xl bg-white/[0.02] text-center text-xs text-slate-500">
                  No other active sessions found.
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
