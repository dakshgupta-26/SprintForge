"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { AuthErrorAlert, normalizeAuthError, AuthErrorInfo } from "./AuthErrorAlert";

export type ForgotPasswordState = "input" | "submitting" | "success";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  initialEmail?: string;
  onClose: () => void;
}

/**
 * Returns a webmail URL if the email domain is a recognized public provider.
 */
function getWebmailProviderUrl(email: string): { name: string; url: string } | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  if (domain.includes("gmail.com") || domain.includes("googlemail.com")) {
    return { name: "Open Gmail", url: "https://mail.google.com" };
  }
  if (domain.includes("outlook.com") || domain.includes("hotmail.com") || domain.includes("live.com")) {
    return { name: "Open Outlook", url: "https://outlook.live.com/mail" };
  }
  if (domain.includes("yahoo.com") || domain.includes("ymail.com")) {
    return { name: "Open Yahoo Mail", url: "https://mail.yahoo.com" };
  }
  if (domain.includes("icloud.com") || domain.includes("me.com")) {
    return { name: "Open iCloud Mail", url: "https://www.icloud.com/mail" };
  }
  if (domain.includes("proton.me") || domain.includes("protonmail.com")) {
    return { name: "Open Proton Mail", url: "https://mail.proton.me" };
  }

  return null;
}

export function ForgotPasswordModal({
  isOpen,
  initialEmail = "",
  onClose,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<ForgotPasswordState>("input");
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<AuthErrorInfo | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial email when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setStep("input");
      setError(null);
      setResendFeedback(null);
      setResendCooldown(0);

      // Lock background scroll
      document.body.style.overflow = "hidden";

      // Focus email input after entrance animation
      const focusTimer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);

      return () => {
        clearTimeout(focusTimer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, initialEmail]);

  // Resend cooldown countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [resendCooldown]);

  // Keyboard shortcut listener (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape" && step !== "submitting") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, onClose]);

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Enter your email address.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Enter a valid email address.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error) setError(null);

    const validationMsg = validateEmail(email);
    if (validationMsg) {
      setError({
        title: validationMsg,
        description: "Please check the format and try again.",
        type: "validation",
      });
      emailInputRef.current?.focus();
      return;
    }

    setStep("submitting");

    try {
      await authAPI.forgotPassword({ email: email.trim().toLowerCase() });
      // Transition to dedicated success state
      setStep("success");
      setResendCooldown(30); // 30s rate-limit cooldown
    } catch (err: any) {
      setStep("input");
      setError(normalizeAuthError(err));
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    setResendFeedback(null);

    try {
      await authAPI.forgotPassword({ email: email.trim().toLowerCase() });
      setResendFeedback("New recovery link dispatched to your inbox.");
      setResendCooldown(30);
    } catch (err: any) {
      setError(normalizeAuthError(err));
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  const webmailProvider = getWebmailProviderUrl(email);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
      aria-describedby="forgot-password-desc"
    >
      {/* Backdrop Dismiss Area */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (step !== "submitting") onClose();
        }}
      />

      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[430px] bg-[#090d20] border border-white/[0.1] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(124,92,255,0.12)] z-10 overflow-hidden p-6 sm:p-7 text-slate-100"
      >
        {/* Subtle Ambient Purple Glow Top Sheen */}
        <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent pointer-events-none" />

        {/* ── Top Header Toolbar (Back + Close) ── */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={step === "submitting"}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-white/[0.05] disabled:opacity-40"
            aria-label="Back to sign in"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-medium">Back to sign in</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={step === "submitting"}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Close forgot password modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Dynamic Step Transitions ── */}
        <AnimatePresence mode="wait">
          {/* ───────────────────────────────────────────────────────────── */}
          {/* 1. INPUT STATE */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === "input" && (
            <motion.div
              key="step-input"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {/* Icon & Title */}
              <div className="text-left space-y-1.5">
                <div className="w-11 h-11 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(124,58,237,0.25)] mb-3">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2
                  id="forgot-password-title"
                  className="text-xl sm:text-2xl font-black text-white tracking-tight font-display"
                >
                  Forgot password?
                </h2>
                <p
                  id="forgot-password-desc"
                  className="text-xs sm:text-[13px] text-slate-400 leading-relaxed"
                >
                  No worries. Enter your work email and we&apos;ll send you a secure password reset link.
                </p>
              </div>

              {/* Recovery Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    Work Email
                  </label>
                  <div
                    className={`relative rounded-xl border transition-all duration-200 ${
                      error
                        ? "border-rose-500/50 bg-rose-500/[0.03] shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                        : "border-white/[0.09] bg-white/[0.02] focus-within:border-violet-500 focus-within:bg-[#0c1020] hover:border-white/[0.18]"
                    }`}
                  >
                    <div
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                        error ? "text-rose-400" : "text-slate-500"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      ref={emailInputRef}
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="you@company.com"
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none rounded-xl"
                    />
                  </div>
                </div>

                {/* Inline Error Alert */}
                <AuthErrorAlert error={error} className="my-1.5" />

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full relative group flex items-center justify-center gap-2 py-3 sm:py-3.5 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_24px_rgba(124,92,255,0.4)] hover:shadow-[0_0_34px_rgba(124,92,255,0.65)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden mt-1"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 pointer-events-none" />
                  <span>Send reset link</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </form>

              {/* Informational Security Notice */}
              <p className="text-[11px] text-center text-slate-500 pt-1">
                You can close this window and continue working.
              </p>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 2. SUBMITTING STATE */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === "submitting" && (
            <motion.div
              key="step-submitting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="py-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[220px]"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-3xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_25px_rgba(124,58,237,0.3)]">
                  <Mail className="w-6 h-6 animate-pulse text-violet-300" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white">
                  <Loader2 className="w-3 h-3 animate-spin" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Sending reset link...</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                  We&apos;re securely preparing your password recovery email.
                </p>
              </div>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 3. DEDICATED SUCCESS STATE */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === "success" && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 text-center"
            >
              {/* Success Badge */}
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h2
                  id="forgot-password-title"
                  className="text-xl sm:text-2xl font-black text-white tracking-tight font-display"
                >
                  Check your inbox
                </h2>
                <p
                  id="forgot-password-desc"
                  className="text-xs sm:text-[13px] text-slate-300 leading-relaxed"
                >
                  If an account exists for this email, we&apos;ve sent a password reset link to:
                </p>
                <div className="inline-block max-w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono font-semibold text-violet-300 truncate">
                  {email}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  The link will expire in <strong className="text-slate-200">15 minutes</strong> for your security. Check your spam folder if it doesn&apos;t arrive shortly.
                </p>
              </div>

              {/* Optional Webmail Provider Link */}
              {webmailProvider ? (
                <a
                  href={webmailProvider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-violet-600 hover:bg-violet-500 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <span>{webmailProvider.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-violet-200" />
                </a>
              ) : null}

              {/* Inline Resend Feedback */}
              {resendFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-medium">
                  {resendFeedback}
                </div>
              )}

              {/* Inline Resend Error */}
              {error && <AuthErrorAlert error={error} className="my-1.5" />}

              {/* Resend Action */}
              <div className="pt-1 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-1.5">
                <span>Didn&apos;t receive the email?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-violet-400 hover:text-violet-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Resending...</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <span className="text-slate-500 font-mono">
                      Resend available in {resendCooldown}s
                    </span>
                  ) : (
                    <span>Resend link</span>
                  )}
                </button>
              </div>

              {/* Return to Sign In */}
              <div className="pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Return to sign in
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
