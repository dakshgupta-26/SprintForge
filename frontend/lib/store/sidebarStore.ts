"use client";

import { create } from "zustand";

interface SidebarState {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: typeof window !== "undefined" ? localStorage.getItem("sf_sidebar_collapsed") === "true" : false,
  toggleCollapse: () =>
    set((state) => {
      const next = !state.isCollapsed;
      if (typeof window !== "undefined") {
        localStorage.setItem("sf_sidebar_collapsed", String(next));
      }
      return { isCollapsed: next };
    }),
  setCollapsed: (collapsed) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sf_sidebar_collapsed", String(collapsed));
    }
    set({ isCollapsed: collapsed });
  },
}));
