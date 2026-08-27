import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  bio?: string;
  title?: string;
  provider?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  location?: string;
  website?: string;
  timezone?: string;
  language?: string;
  createdAt?: string;
  profileImage?: {
    fileId?: string;
    filename?: string;
    contentType?: string;
    uploadedAt?: string;
  };
}

export interface AuthResponse {
  verificationRequired?: boolean;
  tempToken?: string;
  email?: string;
  maskedEmail?: string;
  message?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<AuthResponse>;
  verifyEmailOtp: (tempToken: string, otp: string, email?: string) => Promise<void>;
  resendEmailOtp: (tempToken: string, email?: string) => Promise<{ message: string; remainingSeconds?: number }>;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login({ email, password });

          // If first-time login requires email verification
          if (data.verificationRequired) {
            set({ isLoading: false });
            return {
              verificationRequired: true,
              tempToken: data.tempToken,
              email: data.email,
              maskedEmail: data.maskedEmail,
              message: data.message,
            };
          }

          // Verified login
          localStorage.setItem("sf_token", data.token);
          connectSocket(data.user._id);
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          return { verificationRequired: false };
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      loginWithGoogle: async (credential: string) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.googleLogin({ credential });
          localStorage.setItem("sf_token", data.token);
          connectSocket(data.user._id);
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.register({ name, email, password });
          set({ isLoading: false });

          if (data.verificationRequired) {
            return {
              verificationRequired: true,
              tempToken: data.tempToken,
              email: data.email,
              maskedEmail: data.maskedEmail,
              message: data.message,
            };
          }

          if (data.token) {
            localStorage.setItem("sf_token", data.token);
            connectSocket(data.user._id);
            set({ user: data.user, token: data.token, isAuthenticated: true });
          }

          return { verificationRequired: false };
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      verifyEmailOtp: async (tempToken, otp, email) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.verifyEmailOtp({ tempToken, otp, email });
          localStorage.setItem("sf_token", data.token);
          connectSocket(data.user._id);
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      resendEmailOtp: async (tempToken, email) => {
        const { data } = await authAPI.resendEmailOtp({ tempToken, email });
        return data;
      },

      setSession: (token, user) => {
        localStorage.setItem("sf_token", token);
        connectSocket(user._id);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        authAPI.logout().catch(() => {});
        localStorage.removeItem("sf_token");
        localStorage.removeItem("sf_user");
        disconnectSocket();
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (data) => {
        set((state) => ({ user: state.user ? { ...state.user, ...data } : null }));
      },

      initialize: async () => {
        const token = localStorage.getItem("sf_token");
        if (!token) return;
        try {
          const { data } = await authAPI.getMe();
          connectSocket(data._id);
          set({ user: data, token, isAuthenticated: true });
        } catch (err) {
          localStorage.removeItem("sf_token");
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "sf_auth",
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
