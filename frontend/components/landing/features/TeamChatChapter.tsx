"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Lock,
  Send,
  Sparkles,
  Smile,
  Paperclip,
  CheckCheck,
  ShieldCheck,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface ChatBubble {
  id: string;
  sender: string;
  role: string;
  avatar: string;
  color: string;
  time: string;
  text: string;
  codeSnippet?: string;
  reactions?: { emoji: string; count: number }[];
}

const initialMessages: ChatBubble[] = [
  {
    id: "m1",
    sender: "Sarah Lin",
    role: "DevOps Lead",
    avatar: "SL",
    color: "bg-rose-600",
    time: "10:42 AM",
    text: "Auth migration is deployed and ready for review on staging environment!",
    codeSnippet: "GET /api/v2/auth/webauthn -> 200 OK (14ms)",
    reactions: [{ emoji: "🚀", count: 4 }, { emoji: "🔥", count: 3 }],
  },
  {
    id: "m2",
    sender: "David Chen",
    role: "Senior Backend",
    avatar: "DC",
    color: "bg-blue-600",
    time: "10:43 AM",
    text: "Merged PR #128. Automated integration test suite passed with 100% coverage.",
    reactions: [{ emoji: "✅", count: 5 }],
  },
];

export function TeamChatChapter() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [messages, setMessages] = useState<ChatBubble[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(true);
  const [inputVal, setInputVal] = useState("");

  // Simulated live typing and new message
  useEffect(() => {
    if (prefersReducedMotion) {
      setIsTyping(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsTyping(false);
      const newMsg: ChatBubble = {
        id: "m3",
        sender: "Alex Rivera",
        role: "Frontend Lead",
        avatar: "AR",
        color: "bg-violet-600",
        time: "10:44 AM",
        text: "Verified on staging. UI response latency is sub-10ms. Marking SFG-124 ready for release!",
        reactions: [{ emoji: "🎉", count: 3 }],
      };
      setMessages((prev) => (prev.length === 2 ? [...prev, newMsg] : prev));
    }, 4200);

    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg: ChatBubble = {
      id: `m-${Date.now()}`,
      sender: "You",
      role: "Core Engineer",
      avatar: "ME",
      color: "bg-emerald-600",
      time: "Just now",
      text: inputVal,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06] relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[110px] pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Side: Story Description */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Chapter 04 · Communication
          </div>

          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight font-display">
            Encrypted Project Discussions
          </h3>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            Keep architecture decisions and PR reviews directly alongside your Kanban cards. Dedicated channels per project and ticket threads with zero external Slack noise.
          </p>

          {/* Security & Code Highlights */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">End-to-End Encryption</div>
                <div className="text-[11px] text-slate-400">All message payloads encrypted at rest and in transit via TLS 1.3 & AES-256.</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Code Formatting & Task Context</div>
                <div className="text-[11px] text-slate-400">Syntax-highlighted snippets, PR status previews, and instant ticket linking.</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Realistic Chat Workspace */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 rounded-3xl bg-[#080c1a]/95 border border-indigo-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-2xl p-5 sm:p-7 relative flex flex-col justify-between min-h-[460px]"
        >
          {/* Channel Header */}
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
                  #
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-display flex items-center gap-2">
                    <span>sprint-24-core</span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      8 online
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Sprint 24 architecture & code reviews</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25">
                <Lock className="w-3 h-3" />
                <span>E2E Encrypted</span>
              </div>
            </div>

            {/* Message Thread */}
            <div className="space-y-4 my-2">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 text-xs"
                  >
                    <div className={`w-7 h-7 rounded-full ${msg.color} flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm mt-0.5`}>
                      {msg.avatar}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{msg.sender}</span>
                        <span className="text-[10px] text-slate-500">{msg.role}</span>
                        <span className="text-[10px] text-slate-600 font-mono ml-auto">{msg.time}</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#0c1224] border border-white/[0.06] text-slate-200 leading-relaxed">
                        <p>{msg.text}</p>
                        {msg.codeSnippet && (
                          <div className="mt-2 p-2 rounded-lg bg-[#050812] border border-white/[0.06] font-mono text-[11px] text-emerald-400">
                            {msg.codeSnippet}
                          </div>
                        )}
                      </div>
                      {msg.reactions && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {msg.reactions.map((r, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-slate-300 font-medium"
                            >
                              {r.emoji} {r.count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Animated Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[11px] text-violet-400 font-medium pl-10"
                >
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span>Alex Rivera is typing...</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Interactive Chat Input */}
          <form onSubmit={handleSend} className="mt-4 pt-3 border-t border-white/[0.08] flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Message #sprint-24-core or attach code snippet..."
              className="flex-1 bg-[#060914] border border-white/[0.08] focus:border-violet-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
