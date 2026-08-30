"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Download,
  Eye,
  X,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  File,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface AttachmentItem {
  _id?: string;
  fileId?: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy?: string;
  createdAt?: string;
}

interface AttachmentCardProps {
  attachment: AttachmentItem;
  className?: string;
}

export function AttachmentCard({ attachment, className }: AttachmentCardProps) {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const attachmentId = attachment._id || attachment.fileId || "";
  const downloadUrl = attachmentId ? chatAPI.getAttachmentUrl(attachmentId, false) : "#";
  const previewUrl = attachmentId ? chatAPI.getAttachmentUrl(attachmentId, true) : "#";

  const mime = (attachment.mimeType || "").toLowerCase();
  const name = attachment.originalName || "attachment";
  const ext = name.split(".").pop()?.toLowerCase() || "";

  const isPdf = mime.includes("pdf") || ext === "pdf";
  const isImage =
    mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp"].includes(ext);
  const isVideo = mime.startsWith("video/") || ["mp4", "webm", "mov", "mkv"].includes(ext);
  const isAudio = mime.startsWith("audio/") || ["mp3", "wav", "ogg", "aac", "m4a"].includes(ext);
  const isCode =
    mime.includes("json") ||
    mime.includes("javascript") ||
    mime.includes("typescript") ||
    mime.includes("html") ||
    mime.includes("css") ||
    ["ts", "tsx", "js", "jsx", "json", "py", "rs", "go", "cpp", "c", "html", "css", "yaml", "yml", "sql", "sh"].includes(ext);
  const isSpreadsheet =
    mime.includes("excel") || mime.includes("spreadsheet") || ["xlsx", "xls", "csv"].includes(ext);
  const isArchive =
    mime.includes("zip") || mime.includes("compressed") || mime.includes("tar") || ["zip", "rar", "7z", "tar", "gz"].includes(ext);

  const formatFileSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── 1. Image Thumbnail Card ──
  if (isImage && !imageLoadError) {
    return (
      <>
        <div className={cn("mt-2 max-w-sm rounded-2xl overflow-hidden border border-white/[0.1] bg-[#090d20] shadow-md group relative", className)}>
          <div
            onClick={() => setShowImageLightbox(true)}
            className="relative cursor-pointer overflow-hidden max-h-64 bg-[#050814] flex items-center justify-center"
          >
            <img
              src={previewUrl}
              alt={name}
              onError={() => setImageLoadError(true)}
              className="w-full h-auto max-h-64 object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <span className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white hover:scale-110 transition-transform">
                <Maximize2 className="w-4 h-4" />
              </span>
              <a
                href={downloadUrl}
                download={name}
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white hover:scale-110 transition-transform"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="p-2.5 flex items-center justify-between text-[11px] text-slate-300 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate font-medium">{name}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
              {formatFileSize(attachment.size)}
            </span>
          </div>
        </div>

        {/* Image Lightbox Modal */}
        <ImageLightboxModal
          isOpen={showImageLightbox}
          onClose={() => setShowImageLightbox(false)}
          src={previewUrl}
          downloadUrl={downloadUrl}
          filename={name}
          size={formatFileSize(attachment.size)}
        />
      </>
    );
  }

  // ── 2. Video Player Card ──
  if (isVideo) {
    return (
      <div className={cn("mt-2 max-w-md rounded-2xl overflow-hidden border border-white/[0.1] bg-[#090d20] shadow-md", className)}>
        <video
          controls
          preload="metadata"
          className="w-full max-h-72 bg-black rounded-t-2xl"
          src={previewUrl}
        >
          Your browser does not support HTML5 video preview.
        </video>
        <div className="p-2.5 flex items-center justify-between text-[11px] text-slate-300 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <Film className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="truncate font-medium">{name}</span>
          </div>
          <a
            href={downloadUrl}
            download={name}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Download video"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // ── 3. Audio Player Card ──
  if (isAudio) {
    return (
      <div className={cn("mt-2 max-w-sm p-3 rounded-2xl border border-white/[0.1] bg-[#090d20] shadow-md space-y-2", className)}>
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1.5 min-w-0">
            <Music className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="truncate font-medium">{name}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 ml-2">
            {formatFileSize(attachment.size)}
          </span>
        </div>
        <audio controls className="w-full h-8 outline-none" src={previewUrl}>
          Your browser does not support HTML5 audio.
        </audio>
      </div>
    );
  }

  // ── 4. PDF Document Card ──
  if (isPdf) {
    return (
      <>
        <div className={cn("mt-2 w-full max-w-sm rounded-2xl border border-rose-500/20 bg-[#0d1024] p-3 shadow-md hover:border-rose-500/40 transition-all", className)}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate" title={name}>
                {name}
              </h4>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                PDF • {formatFileSize(attachment.size)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setShowPdfModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <a
              href={downloadUrl}
              download={name}
              className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>

        {/* PDF Modal Viewer */}
        <PdfViewerModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          attachmentId={attachmentId}
          previewUrl={previewUrl}
          downloadUrl={downloadUrl}
          filename={name}
          size={formatFileSize(attachment.size)}
        />
      </>
    );
  }

  // ── 5. Generic Document / Spreadsheet / Code / Archive Card ──
  const getFileMeta = () => {
    if (isSpreadsheet) {
      return {
        icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
        bg: "bg-emerald-500/15 border-emerald-500/30",
        type: "Spreadsheet",
      };
    }
    if (isCode) {
      return {
        icon: <FileCode className="w-5 h-5 text-cyan-400" />,
        bg: "bg-cyan-500/15 border-cyan-500/30",
        type: "Code File",
      };
    }
    if (isArchive) {
      return {
        icon: <FileArchive className="w-5 h-5 text-amber-400" />,
        bg: "bg-amber-500/15 border-amber-500/30",
        type: "Archive",
      };
    }
    return {
      icon: <File className="w-5 h-5 text-violet-400" />,
      bg: "bg-violet-500/15 border-violet-500/30",
      type: ext ? `${ext.toUpperCase()} File` : "Document",
    };
  };

  const meta = getFileMeta();

  return (
    <div className={cn("mt-2 w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#0c1024] p-3 shadow-md hover:border-white/[0.2] transition-all", className)}>
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-sm", meta.bg)}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white truncate" title={name}>
            {name}
          </h4>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            {meta.type} • {formatFileSize(attachment.size)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/[0.06]">
        <a
          href={downloadUrl}
          download={name}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-semibold transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download File</span>
        </a>
      </div>
    </div>
  );
}

// ─── PDF Viewer Modal Component ────────────────────────────────────────────────
function PdfViewerModal({
  isOpen,
  onClose,
  attachmentId,
  previewUrl,
  downloadUrl,
  filename,
  size,
}: {
  isOpen: boolean;
  onClose: () => void;
  attachmentId: string;
  previewUrl: string;
  downloadUrl: string;
  filename: string;
  size: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !attachmentId) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;

    const fetchPdf = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await chatAPI.getAttachmentBlob(attachmentId);
        if (!isMounted) return;

        const blob = new Blob([response.data], { type: "application/pdf" });
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        setIsLoading(false);
      } catch (err: any) {
        console.error("PDF preview load error:", err);
        if (isMounted) {
          setIsLoading(false);
          setErrorMessage("The document could not be loaded right now.");
        }
      }
    };

    fetchPdf();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, attachmentId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <div className="fixed inset-0" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl h-[90vh] bg-[#0a0e20] border border-white/[0.12] rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Top Header */}
          <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#070a18] flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate" title={filename}>
                  {filename}
                </h3>
                <p className="text-[10px] font-mono text-slate-400">{size}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 font-semibold transition-all"
                title="Open in new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>New Tab</span>
              </a>
              <a
                href={downloadUrl}
                download={filename}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close viewer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Viewer Body */}
          <div className="flex-1 w-full h-full relative bg-[#04060e] flex items-center justify-center overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#060814] text-center p-6 z-10">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Loading document...</p>
                  <p className="text-xs text-slate-400 font-mono">Preparing secure PDF preview</p>
                </div>
              </div>
            )}

            {errorMessage && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-4 p-8 text-center max-w-md mx-auto z-10">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Unable to preview this file</h4>
                  <p className="text-xs text-slate-400">{errorMessage}</p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-white transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                  <a
                    href={downloadUrl}
                    download={filename}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </a>
                </div>
              </div>
            )}

            {blobUrl && !isLoading && !errorMessage && (
              <iframe
                src={`${blobUrl}#toolbar=1&navpanes=1`}
                title={filename}
                className="w-full h-full border-none bg-[#030610]"
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Image Lightbox Modal Component ────────────────────────────────────────────
function ImageLightboxModal({
  isOpen,
  onClose,
  src,
  downloadUrl,
  filename,
  size,
}: {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  downloadUrl: string;
  filename: string;
  size: string;
}) {
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      setZoomLevel(1);
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
      >
        {/* Top Control Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between p-3 rounded-2xl bg-[#090d20]/80 border border-white/[0.1] backdrop-blur-md"
        >
          <div className="min-w-0 pr-4">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">{filename}</h4>
            <p className="text-[10px] font-mono text-slate-400">{size}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
              className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
              className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-white/[0.1] mx-1" />
            <a
              href={downloadUrl}
              download={filename}
              className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors flex items-center gap-1 px-3 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Image */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-full max-h-[80vh] overflow-auto flex items-center justify-center p-2"
        >
          <img
            src={src}
            alt={filename}
            style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.15s ease-out" }}
            className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      </div>
    </AnimatePresence>
  );
}
