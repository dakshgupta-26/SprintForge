"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Sparkles } from "lucide-react";
import { taskAPI, issueAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import toast from "react-hot-toast";
import { PROJECT_COLORS } from "@/lib/utils";

interface CreateTaskModalProps {
  projectId: string;
  defaultStatus?: string;
  defaultType?: string;
  sprintId?: string;
  onClose: () => void;
  onCreate: () => void;
}

const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];
const TYPE_OPTIONS = ["task", "story", "bug", "epic"];

export function CreateTaskModal({ projectId, defaultStatus = "todo", defaultType, sprintId, onClose, onCreate }: CreateTaskModalProps) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [type, setType] = useState(defaultType || "task");
  const [dueDate, setDueDate] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | "">("");
  const [aiPoints, setAiPoints] = useState<number | null>(null);

  const estimateAI = () => {
    if (!title) return;
    const words = (title + " " + description).split(" ").length;
    const complexity = Math.min(Math.ceil(words / 8), 8);
    const mult = { low: 1, medium: 1.5, high: 2, critical: 3 }[priority] || 1;
    const pts = [1, 2, 3, 5, 8, 13, 21];
    const raw = Math.round(complexity * mult);
    setAiPoints(pts[Math.min(raw - 1, pts.length - 1)] || 3);
    toast.success("AI estimate generated! 🤖");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Task title is required");
    setIsLoading(true);
    try {
      const payload = {
        title: title.trim(), description, priority, type, project: projectId,
        sprint: sprintId || undefined, dueDate: dueDate || undefined,
        storyPoints: storyPoints || aiPoints || undefined,
        boardColumn: defaultStatus, status: defaultStatus,
      };
      
      if (defaultType === "bug") {
        await issueAPI.create(payload);
      } else {
        await taskAPI.create(payload);
      }
      
      toast.success(defaultType === "bug" ? "Bug reported!" : "Task created!");
      onCreate();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl z-10"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Create Task</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Story Points</label>
                <div className="flex gap-2">
                  <input type="number" min={1} max={21} value={storyPoints} onChange={(e) => setStoryPoints(Number(e.target.value) || "")}
                    placeholder={aiPoints ? `AI: ${aiPoints}` : "–"}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button type="button" onClick={estimateAI} title="AI estimate"
                    className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {aiPoints && !storyPoints && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                AI suggests <strong>{aiPoints} story points</strong> for this task
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isLoading}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-60">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
