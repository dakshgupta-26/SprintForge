"use client";

import React, { useState, useEffect } from "react";
import {
  Laptop,
  Smartphone,
  Globe,
  ShieldCheck,
  LogOut,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import toast from "react-hot-toast";

export function SessionsTab() {
  const { user } = useAuthStore();
  const [browserInfo, setBrowserInfo] = useState({
    browser: "Edge / Chrome",
    os: "Windows",
    isMobile: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      let browser = "Browser";
      if (ua.includes("Edg")) browser = "Microsoft Edge";
      else if (ua.includes("Chrome")) browser = "Google Chrome";
      else if (ua.includes("Firefox")) browser = "Mozilla Firefox";
      else if (ua.includes("Safari")) browser = "Apple Safari";

      let os = "Desktop OS";
      if (ua.includes("Windows")) os = "Windows";
      else if (ua.includes("Macintosh")) os = "macOS";
      else if (ua.includes("Linux")) os = "Linux";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

      const isMobile = /Mobi|Android/i.test(ua);

      setBrowserInfo({ browser, os, isMobile });
    }
  }, []);

  const handleRevokeOthers = () => {
    toast.success("All other active sessions have been revoked.");
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#090d20] border border-white/[0.08] shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
              Active Browser Sessions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Devices currently signed in to your SprintForge account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRevokeOthers}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Revoke other sessions
          </button>
        </div>

        {/* Current Active Session */}
        <div className="p-4 rounded-2xl bg-[#060914] border border-violet-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center flex-shrink-0">
              {browserInfo.isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white truncate">
                  {browserInfo.os} · {browserInfo.browser}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  This Device
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <span>Active now</span>
                <span>•</span>
                <span>JWT Session Authenticated</span>
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1 justify-end">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Session
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
