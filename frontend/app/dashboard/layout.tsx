"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { useChatUnreadStore } from "@/lib/store/chatUnreadStore";
import { useCallStore } from "@/lib/store/callStore";
import { Sidebar } from "@/components/shared/Sidebar";
import { Navbar } from "@/components/shared/Navbar";
import { GlobalChatToastContainer } from "@/components/chat/GlobalChatToast";
import { IncomingCallModal } from "@/components/call/IncomingCallModal";
import { GlobalCallMiniBar } from "@/components/call/GlobalCallMiniBar";
import { connectSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

import { useSidebarStore } from "@/lib/store/sidebarStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();
  const { fetchProjects } = useProjectStore();
  const { initialize: initializeChatUnread } = useChatUnreadStore();
  const { initSocketListeners: initializeCallSocket } = useCallStore();
  const { isCollapsed } = useSidebarStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initialize();
      setInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.push("/login");
    } else if (initialized && isAuthenticated && user?._id) {
      fetchProjects();
      connectSocket(user._id);
      initializeChatUnread(user._id);
      initializeCallSocket(user._id);
    }
  }, [initialized, isAuthenticated, user?._id, initializeCallSocket]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 animate-pulse" />
          <div className="space-y-2">
            <div className="h-2 w-32 skeleton" />
            <div className="h-2 w-24 skeleton mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Global Realtime Chat Notification Toast */}
      <GlobalChatToastContainer />

      {/* Global Incoming Call Modal (pops up anywhere across dashboard) */}
      <IncomingCallModal />

      {/* Global Persistent Mini Bar (stays visible when navigating away during an active call) */}
      <GlobalCallMiniBar />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={cn("main-content", isCollapsed && "sidebar-collapsed")}>
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
