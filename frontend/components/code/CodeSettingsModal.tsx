"use client";

import React from "react";
import {
  Settings,
  X,
  Sliders,
  Type,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useCodeStore, DEFAULT_IDE_SETTINGS } from "@/lib/store/codeStore";
import { cn } from "@/lib/utils";

export function CodeSettingsModal() {
  const {
    settingsModalOpen,
    setSettingsModalOpen,
    ideSettings,
    updateIDESettings,
  } = useCodeStore();

  if (!settingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none text-xs">
      <div
        className="w-full max-w-xl bg-[#090d20] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0a0e24]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Editor & Workspace Preferences
              </h3>
              <p className="text-[11px] text-slate-400">
                Customize typography, layout, formatting, and editor behaviors
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSettingsModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Settings Form ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin text-slate-300">
          {/* Typography */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono uppercase font-bold text-violet-400 tracking-wider">
              Typography & Fonts
            </h4>

            {/* Font Size */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div>
                <span className="font-semibold text-white block">Font Size</span>
                <span className="text-[11px] text-slate-400">
                  Controls editor code text size in pixels
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={11}
                  max={20}
                  value={ideSettings.fontSize}
                  onChange={(e) =>
                    updateIDESettings({ fontSize: Number(e.target.value) })
                  }
                  className="w-28 accent-violet-500 cursor-pointer"
                />
                <span className="font-mono text-xs text-white font-bold w-6 text-right">
                  {ideSettings.fontSize}px
                </span>
              </div>
            </div>

            {/* Tab Size */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div>
                <span className="font-semibold text-white block">Tab Size</span>
                <span className="text-[11px] text-slate-400">
                  Number of spaces per indentation level
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                {[2, 4].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => updateIDESettings({ tabSize: size })}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                      ideSettings.tabSize === size
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-white/[0.04] text-slate-400 hover:text-white"
                    )}
                  >
                    {size} Spaces
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <span className="font-semibold text-white block">Font Family</span>
              <select
                value={ideSettings.fontFamily}
                onChange={(e) => updateIDESettings({ fontFamily: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#070a18] border border-white/[0.1] text-xs text-white font-mono focus:outline-none focus:border-violet-500"
              >
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                <option value="'Fira Code', monospace">Fira Code</option>
                <option value="'Cascadia Code', monospace">Cascadia Code</option>
                <option value="Consolas, 'Courier New', monospace">Consolas</option>
                <option value="Menlo, Monaco, monospace">Menlo / Monaco</option>
              </select>
            </div>
          </div>

          {/* Editor Behaviors */}
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            <h4 className="text-[11px] font-mono uppercase font-bold text-violet-400 tracking-wider">
              Display & Layout
            </h4>

            {/* Minimap */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div>
                <span className="font-semibold text-white block">Editor Minimap</span>
                <span className="text-[11px] text-slate-400">
                  Shows code structure overview on the right
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateIDESettings({ minimap: !ideSettings.minimap })}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative cursor-pointer",
                  ideSettings.minimap ? "bg-violet-600" : "bg-white/[0.1]"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5",
                    ideSettings.minimap ? "left-5.5" : "left-0.5"
                  )}
                />
              </button>
            </div>

            {/* Word Wrap */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div>
                <span className="font-semibold text-white block">Word Wrap</span>
                <span className="text-[11px] text-slate-400">
                  Wrap long lines automatically in the editor
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateIDESettings({
                    wordWrap: ideSettings.wordWrap === "on" ? "off" : "on",
                  })
                }
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative cursor-pointer",
                  ideSettings.wordWrap === "on" ? "bg-violet-600" : "bg-white/[0.1]"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5",
                    ideSettings.wordWrap === "on" ? "left-5.5" : "left-0.5"
                  )}
                />
              </button>
            </div>

            {/* Bracket Pair Colorization */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div>
                <span className="font-semibold text-white block">
                  Bracket Pair Colorization
                </span>
                <span className="text-[11px] text-slate-400">
                  Colorize matching brackets for easier readability
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateIDESettings({
                    bracketPairColorization: !ideSettings.bracketPairColorization,
                  })
                }
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative cursor-pointer",
                  ideSettings.bracketPairColorization ? "bg-violet-600" : "bg-white/[0.1]"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5",
                    ideSettings.bracketPairColorization ? "left-5.5" : "left-0.5"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-5 py-3 border-t border-white/[0.08] flex items-center justify-between bg-[#0a0e24]">
          <button
            type="button"
            onClick={() => updateIDESettings(DEFAULT_IDE_SETTINGS)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsModalOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
