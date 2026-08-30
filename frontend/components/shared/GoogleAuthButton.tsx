"use client";
import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
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

export function GoogleAuthButton({ nextUrl, text = "continue_with", onError }: GoogleAuthButtonProps) {
  const router = useRouter();
  const { loginWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      if (onError) {
        onError({
          title: "Google sign-in unavailable",
          description: "Please try again or continue with email and password.",
          type: "server",
        });
      } else {
        toast.error("Google sign-in is temporarily unavailable. Please try again or continue with email.");
      }
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success("Signed in with Google! 🎉");
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
  };

  const handleError = () => {
    if (onError) {
      onError({
        title: "Google sign-in cancelled",
        description: "Google sign-in was cancelled or unavailable. Please try again or continue with email.",
        type: "server",
      });
    } else {
      toast.error("Google sign-in was cancelled or unavailable. Please try again or continue with email.");
    }
  };

  if (!clientId) {
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
            toast.error("Google sign-in is temporarily unavailable. Please try again or continue with email.");
          }
        }}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 sm:py-3 px-4 rounded-xl border border-white/[0.08] dark:border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:border-white/[0.15] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center relative min-h-[42px]">
      {loading ? (
        <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/[0.1] bg-[#0c1022] text-white text-xs sm:text-sm font-semibold shadow-sm">
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          <span>Authenticating with Google...</span>
        </div>
      ) : (
        <div className="w-full [&>div]:w-full [&>div>iframe]:!w-full [&>div]:flex [&>div]:justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            theme="filled_black"
            size="large"
            text={text}
            shape="rectangular"
            width="384"
          />
        </div>
      )}
    </div>
  );
}

