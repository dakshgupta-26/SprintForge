"use client";

import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { normalizeAuthError, AuthErrorInfo } from "@/components/auth/AuthErrorAlert";

interface GoogleAuthButtonProps {
  nextUrl?: string | null;
  text?: "signin_with" | "signup_with" | "continue_with";
  onError?: (error: AuthErrorInfo) => void;
}

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

function ActiveGoogleLoginButton({
  nextUrl,
  label,
  onError,
}: {
  nextUrl?: string | null;
  label: string;
  onError?: (error: AuthErrorInfo) => void;
}) {
  const router = useRouter();
  const { loginWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        await loginWithGoogle(tokenResponse.access_token);
        toast.success("Welcome back! 🎉");
        router.push(nextUrl || "/dashboard");
      } catch (err: any) {
        if (onError) {
          onError(normalizeAuthError(err));
        } else {
          toast.error(
            err?.response?.data?.message ||
              "Google authentication failed. Please try again or continue with email."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      if (onError) {
        onError({
          title: "Google sign-in cancelled",
          description:
            "Google sign-in was closed or could not be completed. Please try again or continue with email.",
          type: "server",
        });
      } else {
        toast.error("Google sign-in was cancelled or unavailable. Please try again.");
      }
    },
  });

  return (
    <button
      type="button"
      onClick={() => {
        if (!loading) googleLogin();
      }}
      disabled={loading}
      className="group relative w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-4 rounded-xl border border-white/[0.09] hover:border-white/[0.2] bg-white/[0.035] hover:bg-white/[0.07] active:bg-white/[0.02] text-slate-100 hover:text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-[0_4px_20px_-4px_rgba(124,92,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-700 pointer-events-none" />

      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          <span className="text-slate-300">Connecting to Google...</span>
        </>
      ) : (
        <>
          <GoogleIcon className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

function FallbackGoogleButton({
  label,
  onError,
}: {
  label: string;
  onError?: (error: AuthErrorInfo) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (onError) {
          onError({
            title: "Google sign-in unavailable",
            description: "Google sign-in is temporarily unavailable. Please continue with your work email.",
            type: "server",
          });
        } else {
          toast.error("Google sign-in is temporarily unavailable. Please continue with email.");
        }
      }}
      className="group relative w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-4 rounded-xl border border-white/[0.09] hover:border-white/[0.2] bg-white/[0.035] hover:bg-white/[0.07] active:bg-white/[0.02] text-slate-100 hover:text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-[0_4px_20px_-4px_rgba(124,92,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-700 pointer-events-none" />
      <GoogleIcon className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <span>{label}</span>
    </button>
  );
}

export function GoogleAuthButton({ nextUrl, text = "continue_with", onError }: GoogleAuthButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  let label = "Continue with Google";
  if (text === "signin_with") label = "Sign in with Google";
  if (text === "signup_with") label = "Sign up with Google";

  if (!clientId) {
    return <FallbackGoogleButton label={label} onError={onError} />;
  }

  return <ActiveGoogleLoginButton nextUrl={nextUrl} label={label} onError={onError} />;
}
