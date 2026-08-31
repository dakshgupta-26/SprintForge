"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Mail,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import toast from "react-hot-toast";

interface OtpVerificationViewProps {
  tempToken?: string;
  email: string;
  maskedEmail?: string;
  /** True when account was created but the verification email could NOT be delivered */
  emailSendFailed?: boolean;
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export function OtpVerificationView({
  tempToken,
  email,
  maskedEmail,
  emailSendFailed = false,
  onSuccess,
  onBackToLogin,
}: OtpVerificationViewProps) {
  const { verifyEmailOtp, resendEmailOtp } = useAuthStore();

  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  // If email already failed, start with cooldown = 0 so resend is immediately available
  const [cooldown, setCooldown] = useState(emailSendFailed ? 0 : 60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailDeliveryFailed, setEmailDeliveryFailed] = useState(emailSendFailed);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Auto-focus first digit on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const newOtp = [...otpValues];
      newOtp[index] = "";
      setOtpValues(newOtp);
      return;
    }

    setErrorMessage(null);

    // If pasted multiple digits
    if (cleanValue.length > 1) {
      const pastedDigits = cleanValue.slice(0, 6).split("");
      const newOtp = [...otpValues];
      pastedDigits.forEach((digit, i) => {
        if (index + i < 6) newOtp[index + i] = digit;
      });
      setOtpValues(newOtp);
      const nextIndex = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();

      // Check if all 6 filled
      if (newOtp.every((d) => d !== "")) {
        handleVerify(newOtp.join(""));
      }
      return;
    }

    // Single digit input
    const newOtp = [...otpValues];
    newOtp[index] = cleanValue[cleanValue.length - 1];
    setOtpValues(newOtp);

    // Move to next input if not at the end
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits are complete
    if (index === 5 && newOtp.every((d) => d !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const digits = pastedData.split("");
    const newOtp = ["", "", "", "", "", ""];
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtpValues(newOtp);
    setErrorMessage(null);

    const focusIndex = Math.min(digits.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (digits.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (fullOtp?: string) => {
    const code = fullOtp || otpValues.join("");
    if (code.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the code");
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      await verifyEmailOtp(tempToken || "", code, email);
      toast.success("Email verified! Welcome to SprintForge 🚀");
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Invalid verification code. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
      // Focus on first input for retry
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      const res = await resendEmailOtp(tempToken || "", email);
      toast.success(res.message || "New verification code sent! 📬");
      setCooldown(60);
      setOtpValues(["", "", "", "", "", ""]);
      setEmailDeliveryFailed(false); // Email succeeded on retry
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to resend verification code";
      toast.error(msg);
      if (err?.response?.data?.remainingSeconds) {
        setCooldown(err.response.data.remainingSeconds);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full">
      {/* Back button */}
      <button
        type="button"
        onClick={onBackToLogin}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to login</span>
      </button>

      {/* Email delivery failure banner */}
      {emailDeliveryFailed && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-amber-200 leading-tight">Verification email could not be delivered</p>
            <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
              Your account is ready. Click &ldquo;Resend code&rdquo; below to try sending the email again.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto mb-3 shadow-[0_0_20px_rgba(124,58,237,0.25)]">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
          {emailDeliveryFailed ? "Resend verification code" : "Verify your email"}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {emailDeliveryFailed
            ? "We\u2019ll resend the code to"
            : "We\u2019ve sent a 6-digit security code to"}
        </p>
        <p className="text-xs font-mono font-bold text-violet-300 mt-0.5 px-2 py-0.5 rounded-md bg-violet-500/10 inline-block border border-violet-500/20">
          {maskedEmail || email}
        </p>
      </div>

      {/* 6 Digit Input Slots */}
      <div className="my-6">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
          {otpValues.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-11 h-13 sm:w-13 sm:h-14 rounded-2xl text-center text-xl sm:text-2xl font-mono font-black border transition-all duration-200 focus:outline-none ${
                errorMessage
                  ? "border-rose-500/80 bg-rose-500/10 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.25)]"
                  : digit
                  ? "border-violet-500 bg-violet-600/15 text-white shadow-[0_0_20px_rgba(124,92,255,0.3)] font-bold"
                  : "border-white/[0.1] bg-white/[0.03] text-white hover:border-white/[0.2] focus:border-violet-500 focus:bg-[#0c1020]"
              }`}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1.5 text-xs text-rose-400 mt-3 justify-center text-center font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Verify Button */}
      <button
        type="button"
        onClick={() => handleVerify()}
        disabled={isVerifying || otpValues.some((d) => !d)}
        className="w-full relative group flex items-center justify-center gap-2 py-3 sm:py-3.5 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_24px_rgba(124,92,255,0.4)] hover:shadow-[0_0_34px_rgba(124,92,255,0.65)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer overflow-hidden"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Verifying code...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Verify and Continue</span>
          </>
        )}
      </button>

      {/* Resend Cooldown Section */}
      <div className="text-center mt-5 text-xs text-slate-400">
        {cooldown > 0 ? (
          <span className="font-mono text-slate-400">
            Resend code in <strong className="text-violet-300">{cooldown}s</strong>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-violet-400 hover:text-violet-300 font-semibold transition-colors hover:underline inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isResending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending new code...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend verification code</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="text-center text-[11px] text-slate-500 mt-4 flex items-center justify-center gap-1.5">
        <Mail className="w-3 h-3" />
        <span>Check your spam or junk folder if you don&apos;t see the email</span>
      </div>
    </div>
  );
}
