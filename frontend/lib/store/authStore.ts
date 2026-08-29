import { create } from "zustand";
import { authAPI } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useProjectStore } from "@/lib/store/projectStore";

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  bio?: string;
  title?: string;
  provider?: string;
  providerId?: string;
  hasPassword?: boolean;
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
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<AuthResponse>;
  verifyEmailOtp: (tempToken: string, otp: string, email?: string) => Promise<void>;
  resendEmailOtp: (tempToken: string, email?: string) => Promise<{ message: string; remainingSeconds?: number }>;
  setPassword: (newPassword: string) => Promise<void>;
  setSession: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login({ email, password });

      // If unverified email requires OTP verification
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

      // Verified login with server-set HttpOnly cookies
      connectSocket(data.user._id);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
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
      connectSocket(data.user._id);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
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
      connectSocket(data.user._id);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  resendEmailOtp: async (tempToken, email) => {
    const { data } = await authAPI.resendEmailOtp({ tempToken, email });
    return data;
  },

  setPassword: async (newPassword: string) => {
    const { data } = await authAPI.setPassword({ newPassword });
    if (data.user) {
      set({ user: data.user });
    } else {
      set((state) => ({ user: state.user ? { ...state.user, hasPassword: true } : null }));
    }
  },

  setSession: (user) => {
    connectSocket(user._id);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      // 1. Disconnect real-time socket
      disconnectSocket();

      // 2. Clear frontend authentication state
      set({ user: null, isAuthenticated: false });

      // 3. Invalidate protected cached workspace data
      try {
        useProjectStore.setState({
          projects: [],
          currentProject: null,
          isLoading: false,
        });
      } catch {
        // Ignore store reset errors
      }

      // 4. Invalidate browser storage caches if any
      if (typeof window !== "undefined") {
        try {
          sessionStorage.clear();
        } catch {
          // Ignore storage clearance errors
        }
      }
    }
  },

  updateUser: (data) => {
    set((state) => ({ user: state.user ? { ...state.user, ...data } : null }));
  },

  initialize: async () => {
    try {
      const { data } = await authAPI.getMe();
      if (data && data._id) {
        connectSocket(data._id);
        set({ user: data, isAuthenticated: true, isInitialized: true });
      } else {
        set({ user: null, isAuthenticated: false, isInitialized: true });
      }
    } catch (err) {
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },
}));

