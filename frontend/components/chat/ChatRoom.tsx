"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { getSocket } from "@/lib/socket";
import { chatAPI } from "@/lib/api";
import { format, isToday, isYesterday } from "date-fns";
import { Send, Loader2, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateAvatar } from "@/lib/utils";

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  content: string;
  createdAt: string;
}

export function ChatRoom({ projectId }: { projectId: string }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await chatAPI.getMessages(projectId);
        setMessages(data);
      } catch (error) {
        console.error("Failed to load messages", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();

    const socket = getSocket();
    if (!socket) return;
    
    // We assume the user has already joined the project room via Sidebar or Navbar
    // But just in case:
    socket.emit("join:project", projectId);

    const handleMessageReceive = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleTypingStart = ({ userId, userName }: { userId: string, userName: string }) => {
      if (userId === user?._id) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: userName }));
    };

    const handleTypingStop = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const newObj = { ...prev };
        delete newObj[userId];
        return newObj;
      });
    };

    socket.on("chat:message:receive", handleMessageReceive);
    socket.on("chat:typing:start", handleTypingStart);
    socket.on("chat:typing:stop", handleTypingStop);

    return () => {
      socket.off("chat:message:receive", handleMessageReceive);
      socket.off("chat:typing:start", handleTypingStart);
      socket.off("chat:typing:stop", handleTypingStop);
    };
  }, [projectId, user?._id]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    const socket = getSocket();
    if (!socket || !user) return;

    socket.emit("chat:typing:start", { projectId, userId: user._id, userName: user.name });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:typing:stop", { projectId, userId: user._id });
    }, 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const socket = getSocket();
    if (!socket) return;

    // Send original message
    socket.emit("chat:message", {
      projectId,
      sender: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      content: newMessage.trim(),
    });

    socket.emit("chat:typing:stop", { projectId, userId: user._id });
    setNewMessage("");
    inputRef.current?.focus();
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday " + format(date, "h:mm a");
    return format(date, "MMM d, h:mm a");
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-card rounded-2xl border border-border">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading encrypted messages...</p>
      </div>
    );
  }

  const typingArray = Object.values(typingUsers);

  return (
    <div className="w-full h-full max-h-[calc(100vh-100px)] flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div>
          <h2 className="font-bold text-foreground">Project Chat</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            End-to-End Encrypted Room
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-texture">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <UserIcon className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">No messages yet.</p>
            <p className="text-xs opacity-70">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender._id === user?._id;
            const showHeader = index === 0 || messages[index - 1].sender._id !== msg.sender._id;

            return (
              <motion.div 
                key={msg._id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}
              >
                {!isMe && showHeader && (
                  <img 
                    src={msg.sender.avatar || generateAvatar(msg.sender.name)} 
                    alt={msg.sender.name} 
                    className="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0 border border-border"
                  />
                )}
                {/* Placeholder to keep alignment for contiguous messages */}
                {!isMe && !showHeader && <div className="w-8 flex-shrink-0" />}

                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {showHeader && (
                    <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                      <span className="text-xs font-bold text-foreground">{isMe ? "You" : msg.sender.name}</span>
                      <span className="text-[10px] px-1.5 bg-primary/10 text-primary capitalize rounded-sm">
                        {msg.sender.role}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{formatMessageTime(msg.createdAt)}</span>
                    </div>
                  )}
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm break-words
                      ${isMe 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-muted text-foreground rounded-tl-sm border border-border/50"
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        
        {typingArray.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground italic ml-11">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            {typingArray.join(", ")} {typingArray.length === 1 ? "is" : "are"} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-muted/20 border-t border-border">
        <form 
          onSubmit={handleSendMessage}
          className="flex items-end gap-2 bg-background border border-border rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 transition-shadow"
        >
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none focus:ring-0 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="p-2.5 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:hover:bg-primary"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
