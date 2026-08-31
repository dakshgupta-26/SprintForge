"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, WifiOff, Clock, ShieldAlert, AlertTriangle } from "lucide-react";

export interface AuthErrorInfo {
  title: string;
  description?: string;
  type?: "invalid_credentials" | "rate_limit" | "network" | "unverified" | "server" | "validation" | "email_send_failed";
  /** For email_send_failed: the tempToken needed to call resend */
  tempToken?: string;
  email?: string;
}

/**
 * Normalizes any backend or client error into a secure, generic user-facing message.
 * Prevents account enumeration and never exposes database or internal server details.
 */
export function normalizeAuthError(err: any): AuthErrorInfo {
  if (!err) {
    return {
      title: "Something went wrong",
      description: "Please try again in a moment.",
      type: "server",
    };
  }

  // If already normalized object
  if (typeof err === "object" && err.title && (err.type || err.description)) {
    return err;
  }

  // 1. Network connection failure / Timeout
  if (
    err.code === "ERR_NETWORK" ||
    err.code === "ECONNABORTED" ||
    err.message?.includes("Network Error") ||
    err.message?.includes("fetch failed") ||
    err.message?.includes("timeout") ||
    (!err.response && (err.isAxiosError || err.request))
  ) {
    return {
      title: "Unable to connect",
      description: "Unable to reach SprintForge. Check your connection and try again.",
      type: "network",
    };
  }

  const status = err.response?.status;
  const rawMsg = String(err.response?.data?.message || err.message || "").toLowerCase();

  // 2. Rate Limiting (429)
  if (status === 429 || rawMsg.includes("too many") || rawMsg.includes("rate limit") || rawMsg.includes("cooldown")) {
    return {
      title: "Too many attempts",
      description: "Please wait a few moments before trying again.",
      type: "rate_limit",
    };
  }

  // 3. Conflict: Account with this email already exists (409 or 400 with duplicate email)
  if (
    status === 409 ||
    rawMsg.includes("already exists") ||
    rawMsg.includes("already registered") ||
    rawMsg.includes("account with this email")
  ) {
    return {
      title: "Account already exists",
      description: "An account with this email already exists. Please sign in instead.",
      type: "validation",
    };
  }

  // 3b. Email delivery failed (207 Multi-Status or 503 with emailSendFailed flag)
  if (
    status === 207 ||
    status === 503 ||
    rawMsg.includes("unable to send verification email") ||
    rawMsg.includes("could not send the verification email")
  ) {
    return {
      title: "Couldn't send verification email",
      description: "Your account is ready, but we couldn't deliver the code. Please retry.",
      type: "email_send_failed",
    };
  }

  // 4. Email verification required
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

  // 5. Genuine Account Deactivation / Suspension (ONLY on 403 or explicit account deactivation message)
  if (
    (status === 403 && (rawMsg.includes("deactivated") || rawMsg.includes("suspended") || rawMsg.includes("account is disabled") || rawMsg.includes("account has been disabled"))) ||
    rawMsg.includes("account has been deactivated") ||
    rawMsg.includes("account has been suspended")
  ) {
    return {
      title: "Account unavailable",
      description: "This account is currently unavailable. Please contact workspace support.",
      type: "server",
    };
  }

  // 6. Security / CSRF Forbidden (403 without account deactivation)
  if (status === 403) {
    return {
      title: "Access denied",
      description: "Security check could not be verified. Please refresh the page and try again.",
      type: "server",
    };
  }

  // 7. 401 Unauthorized / Invalid Credentials
  if (
    status === 401 ||
    rawMsg.includes("incorrect") ||
    rawMsg.includes("invalid email or password") ||
    rawMsg.includes("invalid credentials") ||
    rawMsg.includes("password is incorrect")
  ) {
    return {
      title: "Invalid email or password",
      description: "Check your credentials and try again.",
      type: "invalid_credentials",
    };
  }

  // 8. 400 Bad Request / Validation errors
  if (status === 400) {
    const customMsg = err.response?.data?.message;
    if (customMsg && typeof customMsg === "string" && customMsg.length > 3 && customMsg.length < 120) {
      return {
        title: customMsg,
        description: "Please check your details and try again.",
        type: "validation",
      };
    }
    return {
      title: "Invalid signup information",
      description: "Please check all fields and try again.",
      type: "validation",
    };
  }

  // 9. Service Unavailable / Gateway Errors (502 / 503 / 504)
  if (status === 502 || status === 503 || status === 504) {
    return {
      title: "Service temporarily unavailable",
      description: "Authentication service temporarily unavailable. Please try again in a moment.",
      type: "server",
    };
  }

  // 10. Server Error (500+)
  if (status && status >= 500) {
    return {
      title: "Something went wrong",
      description: "Something went wrong on our side. Please try again.",
      type: "server",
    };
  }

  // 11. Generic Fallback
  return {
    title: "Something went wrong",
    description: "Please try again in a moment.",
    type: "server",
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
      case "email_send_failed":
        return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />;
      case "server":
        return <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />;
      default:
        return <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />;
    }
  };

  const isEmailFailed = errorObj.type === "email_send_failed";
  const isUnverified = errorObj.type === "unverified";

  const containerClass = isEmailFailed || errorObj.type === "rate_limit" || errorObj.type === "network"
    ? `p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-start gap-2.5 shadow-sm text-left ${className}`
    : isUnverified
    ? `p-3 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-300 flex items-start gap-2.5 shadow-sm text-left ${className}`
    : `p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-start gap-2.5 shadow-sm text-left ${className}`;

  const titleClass = isEmailFailed || errorObj.type === "rate_limit" || errorObj.type === "network"
    ? "text-xs font-bold text-amber-200 leading-tight"
    : isUnverified
    ? "text-xs font-bold text-violet-200 leading-tight"
    : "text-xs font-bold text-rose-200 leading-tight";

  const descClass = isEmailFailed || errorObj.type === "rate_limit" || errorObj.type === "network"
    ? "text-[11px] text-amber-300/80 mt-0.5 leading-relaxed"
    : isUnverified
    ? "text-[11px] text-violet-300/80 mt-0.5 leading-relaxed"
    : "text-[11px] text-rose-300/80 mt-0.5 leading-relaxed";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        role="alert"
        aria-live="assertive"
        className={containerClass}
      >
        {getIcon()}
        <div className="min-w-0 flex-1">
          <p className={titleClass}>
            {errorObj.title}
          </p>
          {errorObj.description && (
            <p className={descClass}>
              {errorObj.description}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
