"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import {
  Clock,
  Shield,
  FolderKanban,
  UserCheck,
  KeyRound,
  Lock,
  LogOut,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Smartphone,
  Laptop,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";

interface SecurityLogItem {
  _id: string;
  event: string;
  ipAddress?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  status: "success" | "failure" | "warning";
  details?: string;
  createdAt: string;
}

export function AccountActivityTab() {
  const { user } = useAuthStore();
  const { projects } = useProjectStore();
  const [logs, setLogs] = useState<SecurityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const { data } = await authAPI.getSecurityActivity();
        setLogs(data || []);
      } catch (err) {
        console.error("Failed to load activity logs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getEventBadge = (event: string, status: string) => {
    switch (event) {
      case "LOGIN_SUCCESS":
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          title: "Successful Sign In",
          color: "bg-emerald-500/20 border-emerald-500",
        };
      case "LOGIN_FAILED":
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          title: "Failed Sign In Attempt",
          color: "bg-rose-500/20 border-rose-500",
        };
      case "PASSWORD_CHANGED":
      case "PASSWORD_RESET_COMPLETED":
        return {
          icon: <Lock className="w-3.5 h-3.5 text-violet-400" />,
          title: "Password Updated",
          color: "bg-violet-500/20 border-violet-500",
        };
      case "PASSWORD_RESET_REQUESTED":
        return {
          icon: <KeyRound className="w-3.5 h-3.5 text-amber-400" />,
          title: "Password Reset Link Requested",
          color: "bg-amber-500/20 border-amber-500",
        };
      case "EMAIL_VERIFIED":
        return {
          icon: <Shield className="w-3.5 h-3.5 text-blue-400" />,
          title: "Email Verified via OTP",
          color: "bg-blue-500/20 border-blue-500",
        };
      case "SESSION_REVOKED":
      case "REVOKE_ALL_SESSIONS":
        return {
          icon: <LogOut className="w-3.5 h-3.5 text-slate-400" />,
          title: "Session Signed Out",
          color: "bg-slate-500/20 border-slate-500",
        };
      case "TOKEN_REUSE_DETECTED":
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          title: "Suspicious Session Activity Mitigated",
          color: "bg-rose-500/20 border-rose-500",
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
          title: event.replace(/_/g, " "),
          color: "bg-slate-500/20 border-slate-500",
        };
    }
  };

  const createdAt = user?.createdAt ? new Date(user.createdAt) : new Date();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
            Security & Account Audit Trail
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological record of authentication events, password updates, and session security.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500 mb-2" />
            <p className="text-xs">Loading activity audit trail...</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-white/[0.08] space-y-6">
            {/* Real Security Activity Logs */}
            {logs.map((log) => {
              const meta = getEventBadge(log.event, log.status);
              const eventDate = new Date(log.createdAt);

              return (
                <div key={log._id} className="relative">
                  <div
                    className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${meta.color}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">{meta.title}</p>
                      {log.status === "failure" && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25">
                          Failed
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {log.details ||
                        (log.browser && log.os
                          ? `${log.browser} • ${log.os}`
                          : "Authenticated request")}
                      {log.ipAddress && ` • IP: ${log.ipAddress}`}
                    </p>

                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      {format(eventDate, "MMMM d, yyyy · h:mm a")} (
                      {formatDistanceToNow(eventDate, { addSuffix: true })})
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Workspace Access */}
            {projects.length > 0 && (
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-violet-500/20 border-2 border-violet-500 flex items-center justify-center">
                  <FolderKanban className="w-2.5 h-2.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Active Workspace Access</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Member of {projects.map((p) => p.name).join(", ")}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    {projects.length} workspace{projects.length > 1 ? "s" : ""} connected
                  </p>
                </div>
              </div>
            )}

            {/* Account Provisioned */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                <UserCheck className="w-2.5 h-2.5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Account Provisioned</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  SprintForge account created for {user?.email}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  {format(createdAt, "MMMM d, yyyy · h:mm a")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
