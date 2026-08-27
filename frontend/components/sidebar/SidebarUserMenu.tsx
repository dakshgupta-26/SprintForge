"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  Users,
  LogOut,
  Sparkles,
  Shield,
  MoreVertical,
  Circle,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { generateAvatar, cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface SidebarUserMenuProps {
  isCollapsed: boolean;
  onCloseMobile?: () => void;
}

export function SidebarUserMenu({ isCollapsed, onCloseMobile }: SidebarUserMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out safely");
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const avatar = user?.avatar || generateAvatar(user?.name || "User");

  return (
    <div className="relative p-2.5 border-t border-white/[0.06] bg-[#070b1a]" ref={menuRef}>
      {/* User Row Button */}
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-10 h-10 mx-auto rounded-xl flex items-center justify-center cursor-pointer group"
          title={user?.name || "Profile"}
        >
          <img
            src={avatar}
            alt={user?.name || ""}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/[0.1] group-hover:ring-violet-500/50 transition-all"
          />
          <div className="absolute bottom-0 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070b1a]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-2.5 p-2 rounded-2xl border transition-all text-left group cursor-pointer",
            isOpen
              ? "bg-[#0b1028] border-violet-500/40"
              : "border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={avatar}
                alt={user?.name || ""}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-white/[0.1] group-hover:ring-violet-500/40 transition-all"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070b1a]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate group-hover:text-violet-200 transition-colors">
                {user?.name || "Developer"}
              </p>
              <p className="text-[10px] font-mono text-slate-400 truncate capitalize flex items-center gap-1">
                <span>{user?.role || "Member"}</span>
                <span className="text-emerald-400 font-bold">• Online</span>
              </p>
            </div>
          </div>
          <MoreVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
        </button>
      )}

      {/* User Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 bottom-full mb-2 w-56 bg-[#090d20] border border-white/[0.12] rounded-2xl shadow-2xl p-1.5 space-y-0.5 backdrop-blur-xl",
              isCollapsed ? "left-12" : "left-2 right-2"
            )}
          >
            <div className="px-2.5 py-2 border-b border-white/[0.06] mb-1">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
            </div>

            <Link
              href="/dashboard/profile"
              onClick={() => {
                setIsOpen(false);
                onCloseMobile?.();
              }}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <User className="w-3.5 h-3.5 text-violet-400" />
              <span>Your Profile</span>
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => {
                setIsOpen(false);
                onCloseMobile?.();
              }}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>Account Settings</span>
            </Link>

            <Link
              href="/dashboard/team"
              onClick={() => {
                setIsOpen(false);
                onCloseMobile?.();
              }}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Workspace Team</span>
            </Link>

            <div className="pt-1 border-t border-white/[0.06] mt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
