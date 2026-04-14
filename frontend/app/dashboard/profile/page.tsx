"use client";
import { useState, useRef } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { authAPI } from "@/lib/api";
import { motion } from "framer-motion";
import { Camera, Mail, User as UserIcon, Shield, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { generateAvatar } from "@/lib/utils";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    title: user?.title || "",
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      toast.error("Please upload a valid image file (jpeg, png, webp)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("avatar", file);
      
      const response = await authAPI.uploadAvatar(data);
      updateUser({ avatar: response.data.avatarUrl });
      toast.success("Avatar updated successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload avatar");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await authAPI.updateProfile(formData);
      updateUser(data);
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and avatar.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl bg-muted">
                {isUploading ? (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <img 
                    src={user.avatar || generateAvatar(user.name)} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                title="Change Avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
              />
            </div>
            
            <h2 className="font-bold text-xl">{user.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center mt-1">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>
            <div className="mt-4 flex items-center gap-2 justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full capitalize">
                <Shield className="w-3.5 h-3.5" /> {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Forms */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="p-6 rounded-2xl border border-border bg-card space-y-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" /> Personal Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Job Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Bio</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell your team a little about yourself..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/30 outline-none transition-all min-h-[100px] resize-y"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
