import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  bio?: string;
  title?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
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
          localStorage.setItem("sf_token", data.token);
          connectSocket(data.user._id);
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
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
        } catch {
          localStorage.removeItem("sf_token");
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "sf-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
