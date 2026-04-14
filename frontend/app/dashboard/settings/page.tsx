"use client";
import { useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useTheme } from "next-themes";
import { authAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Settings2, Loader2, Moon, Sun, Bell } from "lucide-react";
import toast from "react-hot-toast";

type Tab = "account" | "security" | "preferences";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<Tab>("security");
  const [isSavingSec, setIsSavingSec] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    
    setIsSavingSec(true);
    try {
      await authAPI.changePassword({ 
        currentPassword: passwords.currentPassword, 
        newPassword: passwords.newPassword 
      });
      toast.success("Password successfully changed!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setIsSavingSec(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account configurations and preferences.</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          <button 
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Shield className="w-4 h-4" /> Security & Password
          </button>
          
          <button 
            onClick={() => setActiveTab("preferences")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'preferences' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Settings2 className="w-4 h-4" /> Preferences
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === "security" && (
              <motion.div 
                key="security"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="p-6 rounded-2xl border border-border bg-card space-y-6"
              >
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" /> Change Password
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Ensure your account is using a long, random password to stay secure.</p>
                </div>
                
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Current Password</label>
                    <input 
                      type="password" 
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">New Password</label>
                    <input 
                      type="password" 
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={isSavingSec}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all disabled:opacity-70"
                    >
                      {isSavingSec ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Update Password
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === "preferences" && (
              <motion.div 
                key="preferences"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Settings2 className="w-5 h-5 text-primary" /> Appearance
                  </h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Theme Preference</p>
                      <p className="text-xs text-muted-foreground">Select your preferred interface theme.</p>
                    </div>
                    <div className="bg-muted p-1 rounded-xl flex items-center">
                      <button 
                        onClick={() => setTheme("light")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <Sun className="w-4 h-4" /> Light
                      </button>
                      <button 
                        onClick={() => setTheme("dark")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <Moon className="w-4 h-4" /> Dark
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-border bg-card">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-primary" /> Notifications
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="n1" defaultChecked className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                      <div>
                        <label htmlFor="n1" className="text-sm font-medium">In-app notifications</label>
                        <p className="text-xs text-muted-foreground">Receive updates within the application.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="n2" defaultChecked className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                      <div>
                        <label htmlFor="n2" className="text-sm font-medium">Email notifications</label>
                        <p className="text-xs text-muted-foreground">Receive periodic daily summaries.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
