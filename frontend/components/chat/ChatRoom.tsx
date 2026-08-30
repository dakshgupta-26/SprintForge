"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { getSocket, connectSocket } from "@/lib/socket";
import { chatAPI } from "@/lib/api";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import {
  Send,
  Loader2,
  Lock,
  Search,
  Users,
  Smile,
  Paperclip,
  Code2,
  Hash,
  X,
  Reply,
  Copy,
  Check,
  CheckCheck,
  Sparkles,
  ArrowDown,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  MessageSquare,
  Info,
  Clock,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateAvatar, cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useChatUnreadStore } from "@/lib/store/chatUnreadStore";
import { AttachmentCard, AttachmentItem } from "./AttachmentCard";
import { EmojiPickerPopover } from "./EmojiPickerPopover";
import toast from "react-hot-toast";

interface MessageSender {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface ReadReceipt {
  user: {
    _id: string;
    name?: string;
    avatar?: string;
    email?: string;
  } | string;
  readAt: string;
}

interface Message {
  _id: string;
  sender: MessageSender;
  content: string;
  createdAt: string;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  attachments?: AttachmentItem[];
  readBy?: ReadReceipt[];
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  isOptimistic?: boolean;
}

interface PendingAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  sizeFormatted: string;
  type: "image" | "file";
  progress: number;
  status: "uploading" | "uploaded" | "error";
  error?: string;
  attachmentData?: AttachmentItem;
}

export function ChatRoom({ projectId }: { projectId: string }) {
  const { user } = useAuthStore();
  const { currentProject, projects, fetchProject } = useProjectStore();
  const { setActiveProjectId, markProjectAsRead, markAllAsRead } = useChatUnreadStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | null>(null);

  // UI Panels
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessageInfo, setSelectedMessageInfo] = useState<Message | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadBelowCount, setUnreadBelowCount] = useState(0);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Derive active project
  const project = useMemo(() => {
    return (
      (currentProject?._id === projectId ? currentProject : null) ||
      projects.find((p) => p._id === projectId) ||
      null
    );
  }, [currentProject, projects, projectId]);

  // Load project if missing
  useEffect(() => {
    if (!project) {
      fetchProject(projectId);
    }
  }, [project, projectId, fetchProject]);

  // Project members list for presence drawer & read receipts
  const projectMembers = useMemo(() => {
    if (project?.members && Array.isArray(project.members)) {
      return project.members.map((m: any) => {
        const memberUser = m.user || {};
        const memberId = memberUser._id || (typeof m.user === "string" ? m.user : `m-${Math.random()}`);
        return {
          _id: memberId,
          name: memberUser.name || "Team Member",
          email: memberUser.email || "",
          avatar: memberUser.avatar,
          role: m.role || "member",
          isOnline: onlineUserIds.has(memberId),
        };
      });
    }
    return [
      {
        _id: user?._id || "1",
        name: user?.name || "You",
        email: user?.email || "",
        avatar: user?.avatar,
        role: "admin",
        isOnline: true,
      },
    ];
  }, [project, onlineUserIds, user]);

  const activeOnlineCount = useMemo(() => {
    if (onlineUserIds.size > 0) {
      // Return count of online members in this project (or total online in project room)
      const projectMemberIds = new Set(projectMembers.map((m) => m._id));
      const matched = Array.from(onlineUserIds).filter((id) => projectMemberIds.has(id));
      return Math.max(matched.length, onlineUserIds.size > 0 ? onlineUserIds.size : 1);
    }
    return 1;
  }, [onlineUserIds, projectMembers]);

  // ─── Scroll Management ───────────────────────────────────────────────────────
  const isNearBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    const threshold = 140;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
      setUnreadBelowCount(0);
      setShowScrollBottom(false);
    }
  }, []);

  const handleScroll = () => {
    const near = isNearBottom();
    setShowScrollBottom(!near);
    if (near) {
      setUnreadBelowCount(0);
    }
  };

  // ─── Emit Read Receipts for visible unread messages ──────────────────────────
  const markMessagesAsRead = useCallback(
    (msgs: Message[]) => {
      if (!user?._id || !projectId) return;

      const unreadMessageIds = msgs
        .filter((m) => {
          if (m.sender?._id === user._id) return false;
          if (m.isOptimistic) return false;
          const alreadyRead = (m.readBy || []).some((r) => {
            const rUserId = typeof r.user === "object" ? r.user?._id : r.user;
            return rUserId === user._id;
          });
          return !alreadyRead;
        })
        .map((m) => m._id);

      if (unreadMessageIds.length > 0) {
        const socket = getSocket();
        if (socket) {
          socket.emit("chat:message:read", {
            projectId,
            messageIds: unreadMessageIds,
            userId: user._id,
            user: {
              _id: user._id,
              name: user.name,
              avatar: user.avatar,
              email: user.email,
            },
          });
        }
        markProjectAsRead(projectId, unreadMessageIds[unreadMessageIds.length - 1]);
      }
    },
    [projectId, user, markProjectAsRead]
  );

  // ─── Active Project & Unread Lifecycle ───────────────────────────────────────
  useEffect(() => {
    setActiveProjectId(projectId);
    return () => {
      setActiveProjectId(null);
    };
  }, [projectId, setActiveProjectId]);

  // ─── Tab Visibility & Window Focus Read Sync ─────────────────────────────────
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible" && messages.length > 0) {
        markMessagesAsRead(messages);
        markProjectAsRead(projectId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [messages, projectId, markMessagesAsRead, markProjectAsRead]);

  // ─── Fetch Messages & Socket Listeners ────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    if (user?._id) {
      connectSocket(user._id);
    }

    const fetchHistory = async () => {
      try {
        const { data } = await chatAPI.getMessages(projectId);
        if (mounted) {
          const list = data || [];
          setMessages(list);

          // Locate first unread message for the "NEW MESSAGES" divider
          const firstUnread = list.find((m: Message) => {
            if (m.sender?._id === user?._id || m.isOptimistic) return false;
            const read = (m.readBy || []).some((r) => {
              const rUserId = typeof r.user === "object" ? r.user?._id : r.user;
              return rUserId === user?._id;
            });
            return !read;
          });

          if (firstUnread) {
            setFirstUnreadMessageId(firstUnread._id);
          }

          markMessagesAsRead(list);
          markProjectAsRead(projectId);
        }
      } catch (error) {
        console.error("Failed to load project messages", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setTimeout(() => scrollToBottom(false), 50);
        }
      }
    };

    fetchHistory();

    const socket = getSocket();
    if (!socket) return;

    // Join project room with explicit userId for server-authoritative presence
    socket.emit("join:project", { projectId, userId: user?._id });

    // Handle initial presence snapshot
    const handlePresenceSync = ({ onlineUserIds: ids }: { onlineUserIds: string[] }) => {
      if (Array.isArray(ids)) {
        setOnlineUserIds(new Set(ids));
      }
    };

    // Handle real-time presence updates (join/leave/disconnect)
    const handlePresenceUpdate = ({ onlineUserIds: ids }: { onlineUserIds: string[] }) => {
      if (Array.isArray(ids)) {
        setOnlineUserIds(new Set(ids));
      }
    };

    const handleMessageReceive = (message: Message) => {
      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => !(m.isOptimistic && m.content === message.content && m.sender?._id === message.sender?._id)
        );
        return [...filtered, message];
      });

      // If user is currently focused in chat, mark incoming message as read
      if (user?._id && message.sender?._id !== user._id) {
        socket.emit("chat:message:read", {
          projectId,
          messageIds: [message._id],
          userId: user._id,
          user: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
            email: user.email,
          },
        });
      }

      if (isNearBottom()) {
        setTimeout(() => scrollToBottom(true), 50);
      } else {
        setUnreadBelowCount((c) => c + 1);
        setShowScrollBottom(true);
      }
    };

    const handleReadReceiptUpdate = (data: {
      messageIds?: string[];
      userId?: string;
      user?: any;
      readAt?: string;
    }) => {
      if (!data || !data.userId) return;
      const targetIds = Array.isArray(data.messageIds) ? new Set(data.messageIds) : null;
      const readTimestamp = data.readAt || new Date().toISOString();

      setMessages((prev) =>
        prev.map((msg) => {
          const isTarget = targetIds
            ? targetIds.has(msg._id)
            : new Date(msg.createdAt).getTime() <= new Date(readTimestamp).getTime() + 1000;

          if (isTarget) {
            const currentReadBy = msg.readBy || [];
            const exists = currentReadBy.some((r) => {
              const rId = typeof r.user === "object" ? r.user?._id : r.user;
              return String(rId) === String(data.userId);
            });
            if (!exists) {
              return {
                ...msg,
                readBy: [
                  ...currentReadBy,
                  {
                    user: data.user || { _id: data.userId },
                    readAt: readTimestamp,
                  },
                ],
              };
            }
          }
          return msg;
        })
      );
    };

    const handleReactionUpdate = ({
      messageId,
      reactions,
    }: {
      messageId: string;
      reactions: Record<string, string[]>;
    }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      );
    };

    const handleTypingStart = ({ userId, userName }: { userId: string; userName: string }) => {
      if (userId === user?._id) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: userName }));
    };

    const handleTypingStop = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    const handleUserProfileUpdated = ({
      userId,
      avatar,
      name,
    }: {
      userId: string;
      avatar: string;
      name?: string;
    }) => {
      if (!userId) return;
      setMessages((prev) =>
        prev.map((msg) => {
          const sId = typeof msg.sender === "object" ? msg.sender?._id : msg.sender;
          if (String(sId) === String(userId)) {
            return {
              ...msg,
              sender: {
                ...msg.sender,
                avatar,
                ...(name ? { name } : {}),
              },
            };
          }
          return msg;
        })
      );
      fetchProject(projectId);
    };

    socket.on("presence:sync", handlePresenceSync);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("chat:message:receive", handleMessageReceive);
    socket.on("chat:message:read:update", handleReadReceiptUpdate);
    socket.on("chat:message:react:update", handleReactionUpdate);
    socket.on("chat:typing:start", handleTypingStart);
    socket.on("chat:typing:stop", handleTypingStop);
    socket.on("user:profile:updated", handleUserProfileUpdated);

    return () => {
      mounted = false;
      socket.off("presence:sync", handlePresenceSync);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("chat:message:receive", handleMessageReceive);
      socket.off("chat:message:read:update", handleReadReceiptUpdate);
      socket.off("chat:message:react:update", handleReactionUpdate);
      socket.off("chat:typing:start", handleTypingStart);
      socket.off("chat:typing:stop", handleTypingStop);
      socket.off("user:profile:updated", handleUserProfileUpdated);
      socket.emit("leave:project", { projectId, userId: user?._id });
    };
  }, [projectId, user, isNearBottom, scrollToBottom, markMessagesAsRead]);

  // ─── Input & Typing Handlers ─────────────────────────────────────────────────
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    // Auto-expand textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    const socket = getSocket();
    if (!socket || !user) return;

    socket.emit("chat:typing:start", {
      projectId,
      userId: user._id,
      userName: user.name,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:typing:stop", { projectId, userId: user._id });
    }, 2000);
  };

  const isOnlyEmojis = (text: string) => {
    if (!text) return false;
    const trimmed = text.trim();
    if (!trimmed) return false;
    const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|\s)+$/u;
    if (!emojiRegex.test(trimmed)) return false;
    const emojiArray = [...trimmed].filter((c) => c.trim() !== "");
    return emojiArray.length > 0 && emojiArray.length <= 5;
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setNewMessage((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = newMessage;
    const updated = text.substring(0, start) + emoji + text.substring(end);
    setNewMessage(updated);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + emoji.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = newMessage.trim();

    // Check if any file is currently uploading
    const hasUploading = pendingAttachments.some((p) => p.status === "uploading");
    if (hasUploading) {
      toast("Please wait for file upload to complete...", { icon: "⏳" });
      return;
    }

    const uploadedAttachments = pendingAttachments
      .filter((p) => p.status === "uploaded" && p.attachmentData)
      .map((p) => p.attachmentData!);

    if ((!text && uploadedAttachments.length === 0) || !user) return;

    const socket = getSocket();
    if (!socket) return;

    let formattedContent = text;
    if (replyingTo) {
      formattedContent = `> Replying to @${replyingTo.sender.name}: "${replyingTo.content.slice(0, 60)}${
        replyingTo.content.length > 60 ? "..." : ""
      }"\n\n${text}`;
    }

    // 1. Optimistic Local Append
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      content: formattedContent,
      attachments: uploadedAttachments,
      readBy: [],
      reactions: {},
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // 2. Emit Socket Event
    socket.emit("chat:message", {
      projectId,
      sender: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      content: formattedContent,
      attachments: uploadedAttachments,
    });

    socket.emit("chat:typing:stop", { projectId, userId: user._id });

    // 3. Reset Composer State
    setNewMessage("");
    setReplyingTo(null);
    setPendingAttachments([]);
    setShowEmojiPicker(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }

    setTimeout(() => scrollToBottom(true), 40);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === "Escape") {
      setReplyingTo(null);
      setShowEmojiPicker(false);
    }
  };

  // ─── File Upload & Drag-and-Drop ─────────────────────────────────────────────
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPending: PendingAttachment[] = [];

    Array.from(files).forEach((file) => {
      // 25 MB max limit
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds maximum allowed size of 25 MB.`);
        return;
      }

      const id = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeFormatted = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${sizeMb} MB`;
      const isImg = file.type.startsWith("image/");

      newPending.push({
        id,
        file,
        name: file.name,
        size: file.size,
        sizeFormatted,
        type: isImg ? "image" : "file",
        progress: 0,
        status: "uploading",
      });
    });

    if (newPending.length === 0) return;

    setPendingAttachments((prev) => [...prev, ...newPending]);

    // Upload each file to GridFS backend
    for (const item of newPending) {
      try {
        const { data } = await chatAPI.uploadAttachment(projectId, item.file, (e) => {
          const percent = Math.round((e.loaded * 100) / (e.total || item.size));
          setPendingAttachments((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, progress: percent } : p))
          );
        });

        if (data?.attachment) {
          setPendingAttachments((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    progress: 100,
                    status: "uploaded",
                    attachmentData: data.attachment,
                  }
                : p
            )
          );
        }
      } catch (err: any) {
        console.error("Upload failed for file:", item.name, err);
        toast.error(`Failed to upload "${item.name}". Please try again.`);
        setPendingAttachments((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: "error", error: "Upload failed" } : p
          )
        );
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // ─── Reactions & Message Actions ─────────────────────────────────────────────
  const handleToggleReaction = (msgId: string, emoji: string) => {
    if (!user?._id) return;
    const socket = getSocket();
    if (!socket) return;

    // Optimistic local update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg._id === msgId) {
          const currentReactions = { ...(msg.reactions || {}) };
          const userList = currentReactions[emoji] || [];
          if (userList.includes(user._id)) {
            currentReactions[emoji] = userList.filter((id) => id !== user._id);
            if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
          } else {
            currentReactions[emoji] = [...userList, user._id];
          }
          return { ...msg, reactions: currentReactions };
        }
        return msg;
      })
    );

    socket.emit("chat:message:react", {
      projectId,
      messageId: msgId,
      emoji,
      userId: user._id,
    });
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    toast.success("Copied to clipboard", { duration: 1500 });
    setTimeout(() => setCopiedMessageId(null), 1800);
  };

  const handleScrollToMessage = (targetMsgId: string) => {
    const el = messageRefs.current[targetMsgId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(targetMsgId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  // ─── Filtered Messages for Search ───────────────────────────────────────────
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.sender?.name?.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#070a14] rounded-2xl border border-white/[0.08]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          </div>
          <p className="text-xs font-mono font-medium text-slate-400">
            Initializing secure project channel...
          </p>
        </div>
      </div>
    );
  }

  const typingArray = Object.values(typingUsers);
  const totalRecipientsCount = Math.max(projectMembers.length - 1, 1);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className="relative w-full h-full flex bg-[#070a14] rounded-2xl sm:rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
    >
      {/* ─── Drag & Drop Overlay ─── */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#090d1c]/90 backdrop-blur-md border-2 border-dashed border-violet-500 flex flex-col items-center justify-center pointer-events-none p-6 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center mb-3">
              <Paperclip className="w-7 h-7 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Drop files to share with your team
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Images, PDFs, documents, or engineering specifications
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ─── MAIN CHAT COLUMN ─── */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* ── 1. Top Chat Header ── */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-white/[0.06] bg-[#080b18]/80 backdrop-blur-md flex items-center justify-between gap-3 flex-shrink-0 z-20">
          {/* Project Identity & Presence Badges */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0"
              style={{ backgroundColor: project?.color || "#6366f1" }}
            >
              {project?.key?.charAt(0) || "P"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  {project?.name || "Project Chat"}
                </h2>
                <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded">
                  {project?.key || "CHAT"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {activeOnlineCount} online
                  </span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="hidden sm:flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-violet-400" />
                  End-to-End Encrypted
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Search Toggle */}
            <button
              onClick={() => setShowSearchBar((prev) => !prev)}
              className={cn(
                "p-2 rounded-xl border transition-all cursor-pointer text-xs",
                showSearchBar
                  ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                  : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]"
              )}
              title="Search in conversation"
            >
              <Search className="w-4 h-4" />
            </button>
            
            {/* Mark All Read Button */}
            <button
              onClick={async () => {
                await markAllAsRead();
                setFirstUnreadMessageId(null);
                toast.success("All messages marked as read", { duration: 2000 });
              }}
              className="p-2 rounded-xl border bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer text-xs flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline-block text-[11px] font-semibold text-slate-300">Mark Read</span>
            </button>

            {/* Interactive Members Drawer Toggle */}
            <button
              onClick={() => setShowMembersDrawer((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold",
                showMembersDrawer
                  ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                  : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]"
              )}
              title="View members & presence"
            >
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline-block">Members</span>
              <span className="text-[10px] font-mono bg-white/[0.06] px-1.5 py-0.2 rounded text-slate-300">
                {projectMembers.length}
              </span>
            </button>
          </div>
        </div>

        {/* ── 2. Collapsible In-Chat Search Bar ── */}
        <AnimatePresence>
          {showSearchBar && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 sm:px-6 py-2.5 bg-[#090d1e] border-b border-white/[0.06] flex items-center gap-2 overflow-hidden z-10"
            >
              <Search className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages by keyword, author, or code..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <span className="text-[10px] font-mono text-slate-400 bg-white/[0.05] px-1.5 py-0.5 rounded">
                  {filteredMessages.length} match{filteredMessages.length === 1 ? "" : "es"}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchBar(false);
                }}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 3. Messages Timeline Area ── */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 scrollbar-thin scrollbar-thumb-white/10"
        >
          {filteredMessages.length === 0 ? (
            /* ── Empty State ── */
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(124,92,255,0.15)]">
                <MessageSquare className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Start the conversation in #{project?.key || "PROJECT"}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
                Discuss sprint tasks, share pull request updates, and collaborate in
                real-time with your team.
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-violet-400" /> AES-256 Encrypted
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Realtime Presence
                </span>
              </div>
            </div>
          ) : (
            filteredMessages.map((msg, index) => {
              const isMe = msg.sender?._id === user?._id;
              const prevMsg = index > 0 ? filteredMessages[index - 1] : null;

              // Check if date divider is needed
              const isFirstOfDate =
                !prevMsg ||
                !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt));

              // Check if sender grouping applies (same sender within 5 mins)
              const isSameSenderAsPrev =
                prevMsg &&
                prevMsg.sender?._id === msg.sender?._id &&
                !isFirstOfDate &&
                Math.abs(
                  new Date(msg.createdAt).getTime() -
                    new Date(prevMsg.createdAt).getTime()
                ) <
                  5 * 60 * 1000;

              const reactions = msg.reactions || {};
              const readReceipts = msg.readBy || [];
              const validReaders = readReceipts.filter((r) => {
                const rId = typeof r.user === "object" ? r.user?._id : r.user;
                return rId !== msg.sender?._id;
              });
              const isReadByAll = validReaders.length >= totalRecipientsCount && totalRecipientsCount > 0;
              const isReadBySome = validReaders.length > 0;

              const isHighlighted = highlightedMessageId === msg._id;

              return (
                <React.Fragment key={msg._id || `msg-${index}`}>
                  {/* Date Divider */}
                  {isFirstOfDate && (
                    <div className="relative flex items-center justify-center my-6">
                      <div className="border-t border-white/[0.06] w-full" />
                      <span className="bg-[#070a14] px-3 py-0.5 text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider absolute rounded-full border border-white/[0.08]">
                        {isToday(new Date(msg.createdAt))
                          ? "Today"
                          : isYesterday(new Date(msg.createdAt))
                          ? "Yesterday"
                          : format(new Date(msg.createdAt), "MMMM d, yyyy")}
                      </span>
                    </div>
                  )}

                  {/* Unread "NEW MESSAGES" Divider */}
                  {msg._id === firstUnreadMessageId && (
                    <div className="relative flex items-center justify-center my-6">
                      <div className="border-t border-violet-500/40 w-full" />
                      <span className="bg-[#0c1024] text-violet-300 px-3.5 py-0.5 text-[10px] font-bold uppercase font-mono tracking-wider absolute rounded-full border border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.35)] flex items-center gap-1.5 z-10">
                        <Sparkles className="w-3 h-3 text-violet-400" />
                        New Messages
                      </span>
                    </div>
                  )}

                  {/* Message Row */}
                  <motion.div
                    ref={(el) => {
                      messageRefs.current[msg._id] = el;
                    }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "group relative flex gap-3 max-w-[85%] sm:max-w-[78%] transition-all",
                      isMe ? "ml-auto flex-row-reverse" : "mr-auto",
                      isSameSenderAsPrev ? "mt-1" : "mt-3.5",
                      isHighlighted && "ring-2 ring-violet-500/70 rounded-2xl bg-violet-500/10 p-1"
                    )}
                  >
                    {/* Avatar */}
                    {!isMe && (
                      <div className="w-8 flex-shrink-0">
                        {!isSameSenderAsPrev ? (
                          <UserAvatar
                            src={msg.sender?.avatar}
                            name={msg.sender?.name || "Member"}
                            size="md"
                            ringClassName="ring-1 ring-white/[0.1] shadow-sm"
                          />
                        ) : null}
                      </div>
                    )}

                    {/* Message Bubble Body Container */}
                    <div className={cn("flex flex-col min-w-0 max-w-full", isMe ? "items-end" : "items-start")}>
                      {/* Sender Header */}
                      {!isSameSenderAsPrev && (
                        <div
                          className={cn(
                            "flex items-center gap-2 mb-1 text-[11px]",
                            isMe && "flex-row-reverse"
                          )}
                        >
                          <span className="font-bold text-slate-200">
                            {isMe ? "You" : msg.sender?.name}
                          </span>
                          {msg.sender?.role && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white/[0.05] text-slate-400 rounded border border-white/[0.06] capitalize">
                              {msg.sender.role}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </span>
                        </div>
                      )}

                      {/* Message Bubble + Closely-Attached Floating Action Toolbar */}
                      <div className="relative group/bubble max-w-full">
                        {/* ── Contextual Action Toolbar (Attached directly to bubble) ── */}
                        <div
                          className={cn(
                            "absolute -top-3.5 z-30 opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 pointer-events-none group-hover/bubble:pointer-events-auto flex items-center gap-0.5 p-1 rounded-xl bg-[#090d1c] border border-white/[0.15] shadow-xl backdrop-blur-md",
                            isMe ? "right-2" : "left-2"
                          )}
                        >
                          {/* Reactions */}
                          {["👍", "🚀", "❤️"].map((emoji) => {
                            const hasReacted = (reactions[emoji] || []).includes(user?._id || "");
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleToggleReaction(msg._id, emoji)}
                                className={cn(
                                  "p-1 rounded-lg hover:bg-white/[0.1] text-xs transition-transform hover:scale-125 cursor-pointer",
                                  hasReacted && "bg-violet-500/20"
                                )}
                                title={`React with ${emoji}`}
                              >
                                {emoji}
                              </button>
                            );
                          })}

                          <div className="w-[1px] h-3 bg-white/[0.1] mx-0.5" />

                          {/* Reply Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(msg);
                              textareaRef.current?.focus();
                            }}
                            className="p-1 rounded-lg hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Reply to message"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>

                          {/* Copy Text Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg._id, msg.content)}
                            className="p-1 rounded-lg hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy text"
                          >
                            {copiedMessageId === msg._id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Read Receipts Info (For own messages) */}
                          {isMe && (
                            <button
                              type="button"
                              onClick={() => setSelectedMessageInfo(msg)}
                              className="p-1 rounded-lg hover:bg-white/[0.1] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                              title="Message Info / Read Receipts"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Actual Message Bubble Card */}
                        <div
                          className={cn(
                            "relative px-4 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-sm break-words max-w-full",
                            isMe
                              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm"
                              : "bg-[#0b0f22] border border-white/[0.08] text-slate-200 rounded-tl-sm"
                          )}
                        >
                          {/* Quote Block if Reply */}
                          {msg.content.startsWith("> Replying to") ? (
                            <div className="p-2 rounded-lg bg-black/25 border-l-2 border-violet-400 text-[11px] mb-2 text-slate-300 italic">
                              {msg.content.split("\n\n")[0]}
                            </div>
                          ) : null}

                          {/* Message Text Content */}
                          {isOnlyEmojis(
                            msg.content.startsWith("> Replying to")
                              ? msg.content.split("\n\n").slice(1).join("\n\n")
                              : msg.content
                          ) && (!msg.attachments || msg.attachments.length === 0) ? (
                            <div className="text-3xl sm:text-4xl py-1 px-1 leading-normal select-text">
                              {msg.content.startsWith("> Replying to")
                                ? msg.content.split("\n\n").slice(1).join("\n\n")
                                : msg.content}
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap font-sans">
                              {msg.content.startsWith("> Replying to")
                                ? msg.content.split("\n\n").slice(1).join("\n\n")
                                : msg.content}
                            </div>
                          )}

                          {/* Real Attachments Rendering */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2">
                              {msg.attachments.map((att, attIdx) => (
                                <AttachmentCard
                                  key={att._id || att.fileId || `att-${attIdx}`}
                                  attachment={att}
                                />
                              ))}
                            </div>
                          )}

                          {/* Delivery & Read Receipts Indicator for Own Messages */}
                          {isMe && (
                            <button
                              type="button"
                              onClick={() => setSelectedMessageInfo(msg)}
                              className="flex items-center justify-end gap-1 mt-1 text-[9px] text-violet-200/80 font-mono hover:text-white transition-colors cursor-pointer ml-auto"
                              title="Click for message info and read receipts"
                            >
                              <span>{format(new Date(msg.createdAt), "h:mm a")}</span>
                              {msg.isOptimistic ? (
                                <Check className="w-2.5 h-2.5 text-violet-300 animate-pulse" />
                              ) : isReadByAll ? (
                                <CheckCheck className="w-3.5 h-3.5 text-cyan-300 font-bold" />
                              ) : isReadBySome ? (
                                <span className="flex items-center gap-0.5 text-cyan-200">
                                  <CheckCheck className="w-3 h-3 text-cyan-200" />
                                  <span className="text-[8px] font-mono">
                                    {validReaders.length}/{totalRecipientsCount}
                                  </span>
                                </span>
                              ) : (
                                <CheckCheck className="w-3 h-3 text-violet-300/60" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Emoji Reactions Attached Directly Underneath Bubble */}
                      {Object.keys(reactions).length > 0 && (
                        <div
                          className={cn(
                            "flex flex-wrap gap-1 mt-1 px-1",
                            isMe ? "justify-end" : "justify-start"
                          )}
                        >
                          {Object.entries(reactions).map(([emoji, userIds]) => {
                            if (!userIds || userIds.length === 0) return null;
                            const hasReacted = userIds.includes(user?._id || "");
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleToggleReaction(msg._id, emoji)}
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all cursor-pointer border",
                                  hasReacted
                                    ? "bg-violet-500/20 border-violet-500/40 text-violet-200 shadow-sm"
                                    : "bg-white/[0.04] border-white/[0.06] text-slate-300 hover:bg-white/[0.08]"
                                )}
                                title={`Reacted by ${userIds.length} member(s)`}
                              >
                                <span>{emoji}</span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {userIds.length}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })
          )}

          {/* Typing Indicator */}
          {typingArray.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
              <span className="flex gap-1 items-center px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {typingArray.join(", ")} {typingArray.length === 1 ? "is" : "are"} typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Floating Jump-to-Bottom Button ── */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              onClick={() => {
                scrollToBottom(true);
                setUnreadBelowCount(0);
              }}
              className="absolute bottom-24 right-6 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-[0_8px_25px_rgba(124,92,255,0.45)] border border-violet-400/30 transition-all cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>
                {unreadBelowCount > 0
                  ? `${unreadBelowCount} new message${unreadBelowCount > 1 ? "s" : ""}`
                  : "Jump to latest"}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── 4. Rich Message Composer ── */}
        <div className="p-3 sm:p-4 bg-[#080b18]/90 border-t border-white/[0.06] flex-shrink-0">
          {/* Active Reply Preview Banner */}
          <AnimatePresence>
            {replyingTo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-2 p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between gap-2 overflow-hidden"
              >
                <div className="flex items-center gap-2 min-w-0 text-xs">
                  <Reply className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  <span className="text-violet-300 font-bold">
                    Replying to {replyingTo.sender?.name}:
                  </span>
                  <span className="text-slate-400 truncate">
                    &ldquo;{replyingTo.content}&rdquo;
                  </span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending Attachments List with Progress Bars */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090d22] border border-white/[0.1] text-xs text-slate-200 shadow-sm"
                >
                  {att.type === "image" ? (
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[130px] font-medium">{att.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({att.sizeFormatted})
                      </span>
                    </div>

                    {att.status === "uploading" && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-20 h-1 bg-white/[0.1] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-200"
                            style={{ width: `${att.progress}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-cyan-300">
                          {att.progress}%
                        </span>
                      </div>
                    )}

                    {att.status === "uploaded" && (
                      <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Ready to send
                      </span>
                    )}

                    {att.status === "error" && (
                      <span className="text-[9px] font-mono text-rose-400">
                        Upload failed
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPendingAttachments((prev) => prev.filter((p) => p.id !== att.id))
                    }
                    className="p-1 rounded-lg hover:bg-white/[0.1] hover:text-rose-400 text-slate-400 transition-colors cursor-pointer ml-1"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input Box */}
          <div className="relative rounded-2xl border border-white/[0.1] bg-[#0c1022] focus-within:border-violet-500/60 focus-within:shadow-[0_0_25px_rgba(124,92,255,0.15)] transition-all p-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${project?.key || "project-chat"} (Enter to send, Shift+Enter for new line)...`}
              rows={1}
              className="w-full bg-transparent text-white placeholder:text-slate-500 text-xs sm:text-sm px-2 py-1 outline-none resize-none max-h-28 leading-relaxed font-sans"
            />

            {/* Bottom Composer Toolbar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] mt-1">
              <div className="flex items-center gap-1">
                {/* Attach File Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Attach file or image (up to 25MB)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Quick Code Block Button */}
                <button
                  type="button"
                  onClick={() => {
                    setNewMessage((prev) => `${prev}\n\`\`\`\n\n\`\`\``);
                    textareaRef.current?.focus();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Insert code snippet"
                >
                  <Code2 className="w-4 h-4" />
                </button>

                {/* Ticket Reference Inserter */}
                <button
                  type="button"
                  onClick={() => {
                    setNewMessage((prev) => `${prev} ${project?.key || "SFG"}-`);
                    textareaRef.current?.focus();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Insert task ticket tag"
                >
                  <Hash className="w-4 h-4" />
                </button>

                {/* Emoji Picker Popover Button */}
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Open emoji picker"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors cursor-pointer",
                      showEmojiPicker
                        ? "bg-violet-500/20 text-violet-300"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    )}
                    title="Insert emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <EmojiPickerPopover
                    isOpen={showEmojiPicker}
                    onClose={() => setShowEmojiPicker(false)}
                    onEmojiSelect={handleEmojiSelect}
                  />
                </div>
              </div>

              {/* Send Message Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!newMessage.trim() && pendingAttachments.length === 0}
                className="flex items-center justify-center p-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(124,92,255,0.35)] hover:shadow-[0_0_22px_rgba(124,92,255,0.55)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                title="Send message (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ─── RIGHT COLLAPSIBLE DRAWER: Members & Presence List ─── */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMembersDrawer && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="border-l border-white/[0.08] bg-[#080b18] flex flex-col h-full overflow-hidden flex-shrink-0 z-10"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Members & Presence
                </h3>
              </div>
              <button
                onClick={() => setShowMembersDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-slate-400 uppercase">
                <span>Active Presence</span>
                <span className="text-emerald-400 font-bold">{activeOnlineCount} Online</span>
              </div>

              {projectMembers.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                >
                  <UserAvatar
                    src={m.avatar}
                    name={m.name}
                    size="sm"
                    showOnline={true}
                    isOnline={m.isOnline}
                    ringClassName="ring-1 ring-white/[0.1]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {m.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                      <span className={m.isOnline ? "text-emerald-400" : "text-slate-500"}>
                        {m.isOnline ? "Online" : "Offline"}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 capitalize">{m.role}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Workspace Info Card */}
              <div className="mt-6 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Channel Security
                </span>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="text-slate-500">Method</span>
                  <span className="font-mono text-emerald-400">WebSocket / TLS</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="text-slate-500">Cipher</span>
                  <span className="font-mono text-violet-300">AES-256-GCM</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="text-slate-500">Project Type</span>
                  <span className="font-mono capitalize text-slate-300">
                    {project?.type || "Scrum"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ─── MESSAGE INFO / READ RECEIPTS MODAL ─── */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedMessageInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#090d1e] border border-white/[0.12] rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-bold text-white">Message Info & Read Receipts</h3>
                </div>
                <button
                  onClick={() => setSelectedMessageInfo(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Snippet */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
                <p className="text-xs text-slate-200 line-clamp-3 font-sans">
                  {selectedMessageInfo.content}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Sent {format(new Date(selectedMessageInfo.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </div>

              {/* Read Receipts Breakdown */}
              {(() => {
                const readers = (selectedMessageInfo.readBy || []).filter((r) => {
                  const rId = typeof r.user === "object" ? r.user?._id : r.user;
                  return rId !== selectedMessageInfo.sender?._id;
                });

                const readUserIds = new Set(
                  readers.map((r) => (typeof r.user === "object" ? r.user?._id : r.user))
                );

                const unreadMembers = projectMembers.filter(
                  (m) => m._id !== selectedMessageInfo.sender?._id && !readUserIds.has(m._id)
                );

                return (
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                    {/* Seen Section */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 mb-2">
                        <span className="flex items-center gap-1 font-bold">
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                          Read by ({readers.length}/{totalRecipientsCount})
                        </span>
                      </div>
                      {readers.length === 0 ? (
                        <p className="text-xs text-slate-500 italic px-2">No recipients have read this message yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {readers.map((r, idx) => {
                            const u =
                              typeof r.user === "object"
                                ? r.user
                                : projectMembers.find((m) => m._id === r.user) || {
                                    _id: r.user,
                                    name: "Team Member",
                                  };
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/15 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <UserAvatar
                                    src={u?.avatar}
                                    name={u?.name || "Member"}
                                    size="xs"
                                    ringClassName="ring-1 ring-cyan-400/30"
                                  />
                                  <span className="font-semibold text-slate-200 truncate">{u?.name}</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {r.readAt ? format(new Date(r.readAt), "h:mm a") : "Read"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Unread Section */}
                    {unreadMembers.length > 0 && (
                      <div>
                        <div className="text-[11px] font-mono text-slate-400 mb-2 font-bold">
                          Not read yet ({unreadMembers.length})
                        </div>
                        <div className="space-y-1.5">
                          {unreadMembers.map((m) => (
                            <div
                              key={m._id}
                              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs opacity-70"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <UserAvatar
                                  src={m.avatar}
                                  name={m.name}
                                  size="xs"
                                  ringClassName="ring-1 ring-white/[0.08]"
                                />
                                <span className="font-medium text-slate-300 truncate">{m.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">Delivered</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedMessageInfo(null)}
                className="w-full mt-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
