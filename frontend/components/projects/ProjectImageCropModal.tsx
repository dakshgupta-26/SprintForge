"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Loader2,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { useProjectStore } from "@/lib/store/projectStore";
import toast from "react-hot-toast";

interface ProjectImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onImageUpdated?: (imageUrl: string) => void;
}

export function ProjectImageCropModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onImageUpdated,
}: ProjectImageCropModalProps) {
  const { uploadImage } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected file and loaded image
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Crop & Transform state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Upload state: 'idle' | 'uploading' | 'processing' | 'saved'
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "saved">("idle");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setImageObj(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setUploadStatus("idle");
    }
  }, [isOpen]);

  // Load image when file is selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      toast.error("Please select a valid image file (PNG, JPG, or WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImageObj(img);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Draw main interactive canvas
  const drawMainCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Dark backdrop
    ctx.fillStyle = "#060914";
    ctx.fillRect(0, 0, width, height);

    // Calculate scale to fit crop zone
    const cropSize = Math.min(width, height) * 0.75;
    const cropX = (width - cropSize) / 2;
    const cropY = (height - cropSize) / 2;

    const baseScale = Math.max(cropSize / imageObj.width, cropSize / imageObj.height);
    const scale = baseScale * zoom;

    const imgWidth = imageObj.width * scale;
    const imgHeight = imageObj.height * scale;

    const imgX = width / 2 - imgWidth / 2 + pan.x;
    const imgY = height / 2 - imgHeight / 2 + pan.y;

    // Draw the image
    ctx.drawImage(imageObj, imgX, imgY, imgWidth, imgHeight);

    // Draw dark mask outside the crop zone
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    // Cut out squircle crop zone
    const radius = 24;
    ctx.moveTo(cropX + radius, cropY);
    ctx.lineTo(cropX + cropSize - radius, cropY);
    ctx.quadraticCurveTo(cropX + cropSize, cropY, cropX + cropSize, cropY + radius);
    ctx.lineTo(cropX + cropSize, cropY + cropSize - radius);
    ctx.quadraticCurveTo(cropX + cropSize, cropY + cropSize, cropX + cropSize - radius, cropY + cropSize);
    ctx.lineTo(cropX + radius, cropY + cropSize);
    ctx.quadraticCurveTo(cropX, cropY + cropSize, cropX, cropY + cropSize - radius);
    ctx.lineTo(cropX, cropY + radius);
    ctx.quadraticCurveTo(cropX, cropY, cropX + radius, cropY);
    ctx.closePath();
    ctx.fill("evenodd");

    // Draw crop border
    ctx.strokeStyle = "rgba(139, 92, 246, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cropX + radius, cropY);
    ctx.lineTo(cropX + cropSize - radius, cropY);
    ctx.quadraticCurveTo(cropX + cropSize, cropY, cropX + cropSize, cropY + radius);
    ctx.lineTo(cropX + cropSize, cropY + cropSize - radius);
    ctx.quadraticCurveTo(cropX + cropSize, cropY + cropSize, cropX + cropSize - radius, cropY + cropSize);
    ctx.lineTo(cropX + radius, cropY + cropSize);
    ctx.quadraticCurveTo(cropX, cropY + cropSize, cropX, cropY + cropSize - radius);
    ctx.lineTo(cropX, cropY + radius);
    ctx.quadraticCurveTo(cropX, cropY, cropX + radius, cropY);
    ctx.stroke();

    // Draw preview canvas (128x128)
    const prevCanvas = previewCanvasRef.current;
    if (prevCanvas) {
      const pCtx = prevCanvas.getContext("2d");
      if (pCtx) {
        pCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
        // Draw the exact area inside the crop box
        pCtx.drawImage(
          canvas,
          cropX,
          cropY,
          cropSize,
          cropSize,
          0,
          0,
          prevCanvas.width,
          prevCanvas.height
        );
      }
    }
  }, [imageObj, zoom, pan]);

  useEffect(() => {
    drawMainCanvas();
  }, [drawMainCanvas]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)));
  };

  // Export cropped area as Blob and upload
  const handleSaveCrop = async () => {
    if (!canvasRef.current || !imageObj) return;

    setUploadStatus("uploading");

    try {
      const canvas = canvasRef.current;
      const cropSize = Math.min(canvas.width, canvas.height) * 0.75;
      const cropX = (canvas.width - cropSize) / 2;
      const cropY = (canvas.height - cropSize) / 2;

      // Create a high-res output canvas (512x512)
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = 512;
      exportCanvas.height = 512;
      const expCtx = exportCanvas.getContext("2d");
      if (!expCtx) throw new Error("Could not create canvas context");

      // Draw original image with exact transformations onto export canvas
      const baseScale = Math.max(cropSize / imageObj.width, cropSize / imageObj.height);
      const scale = baseScale * zoom;
      const exportScaleFactor = 512 / cropSize;

      const imgWidth = imageObj.width * scale * exportScaleFactor;
      const imgHeight = imageObj.height * scale * exportScaleFactor;

      const imgX = (canvas.width / 2 - (imageObj.width * scale) / 2 + pan.x - cropX) * exportScaleFactor;
      const imgY = (canvas.height / 2 - (imageObj.height * scale) / 2 + pan.y - cropY) * exportScaleFactor;

      expCtx.drawImage(imageObj, imgX, imgY, imgWidth, imgHeight);

      setUploadStatus("processing");

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) =>
        exportCanvas.toBlob((b) => resolve(b), "image/png", 0.95)
      );

      if (!blob) throw new Error("Could not process cropped image");

      const croppedFile = new File([blob], `project_${projectId}_avatar.png`, {
        type: "image/png",
      });

      const res = await uploadImage(projectId, croppedFile);

      setUploadStatus("saved");
      toast.success("Project avatar updated ✨");

      if (onImageUpdated && res?.imageUrl) {
        onImageUpdated(res.imageUrl);
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setUploadStatus("idle");
      toast.error(err?.response?.data?.message || err?.message || "Failed to save project image");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={uploadStatus === "idle" ? onClose : undefined}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#090d20] border border-white/[0.12] rounded-3xl shadow-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0b1028] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Crop Project Avatar</h3>
            </div>
            {uploadStatus === "idle" && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {!imageObj ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-10 border-2 border-dashed border-white/[0.12] hover:border-violet-500/50 rounded-2xl bg-[#060914] text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Upload Project Image</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Click to choose a file or drag and drop. Supported: PNG, JPG, WebP (max 5MB).
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Crop Viewport */}
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={300}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    className="w-full h-[260px] bg-[#060914] cursor-grab active:cursor-grabbing select-none"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    Drag to pan • Scroll to zoom
                  </span>
                </div>

                {/* Controls Bar */}
                <div className="flex items-center justify-between gap-4 px-1">
                  <div className="flex items-center gap-2 flex-1">
                    <ZoomOut className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                    <ZoomIn className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-[11px] font-mono text-slate-300 w-10 text-right">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                    title="Reset position"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-violet-400 hover:text-violet-300 font-medium"
                  >
                    Choose different file
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Live Preview Bar */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-violet-500/40 shadow-sm flex-shrink-0 bg-[#060914]">
                    <canvas ref={previewCanvasRef} width={128} height={128} className="w-full h-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{projectName}</p>
                    <p className="text-[10px] text-slate-400">Live preview across switcher & sidebar</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0b1028] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={uploadStatus !== "idle"}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            {imageObj && (
              <button
                type="button"
                onClick={handleSaveCrop}
                disabled={uploadStatus !== "idle"}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(124,92,255,0.35)] disabled:opacity-60 cursor-pointer"
              >
                {uploadStatus === "uploading" && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                )}
                {uploadStatus === "processing" && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                )}
                {uploadStatus === "saved" && (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                )}
                {uploadStatus === "idle" && <span>Crop & Save Avatar</span>}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
