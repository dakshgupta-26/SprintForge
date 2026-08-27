"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Trash2,
  Loader2,
  Check,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { UserAvatar } from "@/components/shared/UserAvatar";
import toast from "react-hot-toast";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AvatarUploadModal({ isOpen, onClose }: AvatarUploadModalProps) {
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|jpg|png|webp|gif)/)) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const response = await authAPI.uploadAvatar(formData);
      const newAvatarUrl = response.data.avatarUrl;
      const updatedUserData = response.data.user || {};

      updateUser({
        avatar: newAvatarUrl,
        profileImage: updatedUserData.profileImage,
      });

      toast.success("Profile photo updated permanently in MongoDB! ✨");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    try {
      await authAPI.removeAvatar();
      updateUser({ avatar: "", profileImage: undefined });
      toast.success("Profile photo removed");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove photo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-md bg-[#090d20] border border-white/[0.12] rounded-3xl shadow-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0b1028] flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Change Profile Photo</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col items-center text-center space-y-5">
            {/* Avatar Preview Ring */}
            <div className="relative">
              {previewUrl ? (
                <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-violet-500/40 shadow-2xl bg-[#060914] flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={user?.name || "Preview"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <UserAvatar
                  src={user?.avatar}
                  name={user?.name}
                  size="2xl"
                  ringClassName="ring-4 ring-violet-500/40 shadow-2xl w-32 h-32"
                />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-300">
                Upload a clear photo or square image (max 5MB)
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Persisted in MongoDB GridFS · Formats: JPEG, PNG, WebP, GIF
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{selectedFile ? "Choose Different Image" : "Choose Image"}</span>
              </button>

              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
                  title="Remove current avatar"
                  aria-label="Remove profile photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg, image/png, image/webp, image/gif"
                className="hidden"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0b1028] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-40"
            >
              {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Photo</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
