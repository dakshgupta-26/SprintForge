"use client";
import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    // If no client ID is set yet, render children without crashing
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
