"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, WifiOff, Clock, ShieldAlert, AlertTriangle } from "lucide-react";

export interface AuthErrorInfo {
  title: string;
  description?: string;
  type?: "invalid_credentials" | "rate_limit" | "network" | "unverified" | "server" | "validation";
}

/**
 * Normalizes any backend or client error into a secure, generic user-facing message.
 * Prevents account enumeration and never exposes database or internal server details.
 */
export function normalizeAuthError(err: any): AuthErrorInfo {
  if (!err) {
    return {
      title: "Invalid email or password",
      description: "Check your credentials and try again.",
      type: "invalid_credentials",
    };
  }

  // If already normalized object
  if (typeof err === "object" && err.title) {
    return err;
  }

  // Network connection failure
  if (
    err.code === "ERR_NETWORK" ||
    err.message?.includes("Network Error") ||
    err.message?.includes("fetch failed") ||
    (!err.response && (err.isAxiosError || err.request))
  ) {
    return {
      title: "Unable to connect",
      description: "Check your internet connection and try again.",
      type: "network",
    };
  }

  const status = err.response?.status;
  const rawMsg = String(err.response?.data?.message || err.message || "").toLowerCase();

  // Rate Limiting (429)
  if (status === 429 || rawMsg.includes("too many") || rawMsg.includes("rate limit")) {
    return {
      title: "Too many sign-in attempts",
      description: "Please wait a few moments before trying again.",
      type: "rate_limit",
    };
  }

  // Email verification required
  if (
    rawMsg.includes("verify your email") ||
    rawMsg.includes("email not verified") ||
    rawMsg.includes("verification required")
  ) {
    return {
      title: "Email verification required",
      description: "Please check your inbox to verify your email before signing in.",
      type: "unverified",
    };
  }

  // Account disabled or deactivated
  if (
    rawMsg.includes("disabled") ||
    rawMsg.includes("deactivated") ||
    rawMsg.includes("suspended") ||
    rawMsg.includes("blocked")
  ) {
    return {
      title: "Account unavailable",
      description: "This account is currently unavailable. Please contact workspace support.",
      type: "server",
    };
  }

  // 400 / 401 Unauthorized / Invalid Credentials
  if (
    status === 400 ||
    status === 401 ||
    rawMsg.includes("invalid") ||
    rawMsg.includes("incorrect") ||
    rawMsg.includes("credential") ||
    rawMsg.includes("password") ||
    rawMsg.includes("not found") ||
    rawMsg.includes("unauthorized")
  ) {
    return {
      title: "Invalid email or password",
      description: "Check your credentials and try again.",
      type: "invalid_credentials",
    };
  }

  // Server error (500+)
  if (status >= 500) {
    return {
      title: "Something went wrong",
      description: "Unable to complete sign-in right now. Please try again.",
      type: "server",
    };
  }

  // Fallback generic
  return {
    title: "Invalid email or password",
    description: "Check your credentials and try again.",
    type: "invalid_credentials",
  };
}

interface AuthErrorAlertProps {
  error: AuthErrorInfo | string | null;
  className?: string;
}

export function AuthErrorAlert({ error, className = "" }: AuthErrorAlertProps) {
  if (!error) return null;

  const errorObj: AuthErrorInfo =
    typeof error === "string"
      ? { title: error, description: "Check your credentials and try again." }
      : error;

  const getIcon = () => {
    switch (errorObj.type) {
      case "network":
        return <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />;
      case "rate_limit":
        return <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />;
      case "unverified":
        return <ShieldAlert className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />;
      case "server":
        return <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />;
      default:
        return <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        role="alert"
        aria-live="assertive"
        className={`p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-start gap-2.5 shadow-sm text-left ${className}`}
      >
        {getIcon()}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-rose-200 leading-tight">
            {errorObj.title}
          </p>
          {errorObj.description && (
            <p className="text-[11px] text-rose-300/80 mt-0.5 leading-relaxed">
              {errorObj.description}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
