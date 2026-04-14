"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, MessageCircle, Paperclip, Flag, Clock, User, Tag, Send, ExternalLink, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { taskAPI } from "@/lib/api";
import { cn, PRIORITY_BG, STATUS_LABELS, formatDate, generateAvatar } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/authStore";

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function TaskDetailModal({ taskId, onClose, onUpdate }: TaskDetailModalProps) {
  const { user } = useAuthStore();
  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "activity">("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", priority: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await taskAPI.getOne(taskId);
        setTask(data);
        setEditForm({ title: data.title, description: data.description || "", priority: data.priority });
      } catch {
        toast.error("Failed to load task");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [taskId]);

  const submitComment = async () => {
    if (!comment.trim()) return;
    setIsCommenting(true);
    try {
      const { data } = await taskAPI.addComment(taskId, { content: comment });
      setTask((prev: any) => ({ ...prev, comments: [...(prev.comments || []), data] }));
      setComment("");
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await taskAPI.updateStatus(taskId, { status, boardColumn: status });
      setTask((prev: any) => ({ ...prev, status, boardColumn: status }));
      onUpdate();
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      await taskAPI.delete(taskId);
      toast.success("Deleted successfully");
      onUpdate();
      onClose();
    } catch { toast.error("Failed to delete"); }
  };

  const handleSave = async () => {
    try {
      await taskAPI.update(taskId, editForm);
      setTask({ ...task, ...editForm });
      setIsEditing(false);
      onUpdate();
      toast.success("Updated successfully");
    } catch { toast.error("Failed to update"); }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : task ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-border flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                        task.type === "bug" ? "bg-red-500/15 text-red-400" :
                        task.type === "story" ? "bg-blue-500/15 text-blue-400" :
                        "bg-muted text-muted-foreground")}>
                        {task.type}
                      </span>
                      <span className="text-xs text-muted-foreground">#{task._id?.slice(-6).toUpperCase()}</span>
                    </div>
                    {isEditing ? (
                      <input 
                        value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="text-xl font-bold text-foreground leading-tight bg-background border border-border rounded-lg px-3 py-1.5 w-full focus:ring-2 focus:ring-primary/30"
                      />
                    ) : (
                      <h2 className="text-xl font-bold text-foreground leading-tight">{task.title}</h2>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isEditing ? (
                      <button onClick={handleSave} className="p-2 hover:bg-green-500/10 text-green-500 rounded-xl transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={handleDelete} className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4">
                  {(["details", "comments", "activity"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
                        activeTab === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                      {tab}
                      {tab === "comments" && task.comments?.length > 0 && (
                        <span className="ml-1.5 text-xs bg-muted px-1 rounded">{task.comments.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === "details" && (
                  <div className="grid grid-cols-3 divide-x divide-border">
                    {/* Main column */}
                    <div className="col-span-2 p-6 space-y-5">
                      {isEditing ? (
                        <div>
                           <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h3>
                           <textarea rows={6} value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full text-sm text-foreground leading-relaxed bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Add steps to reproduce, expected behavior..." />
                        </div>
                      ) : task.description ? (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h3>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{task.description}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No description provided.</p>
                      )}

                      {/* Subtasks */}
                      {task.subtasks?.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Subtasks ({task.subtasks.filter((s: any) => s.status === "done").length}/{task.subtasks.length})
                          </h3>
                          <div className="space-y-1.5">
                            {task.subtasks.map((sub: any) => (
                              <div key={sub._id} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50">
                                <div className={cn("w-3 h-3 rounded-full border-2",
                                  sub.status === "done" ? "bg-green-500 border-green-500" : "border-muted-foreground")} />
                                <span className={cn("text-sm", sub.status === "done" && "line-through text-muted-foreground")}>
                                  {sub.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta sidebar */}
                    <div className="p-6 space-y-4">
                      {/* Status */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Status</label>
                        <select value={task.status} onChange={(e) => updateStatus(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Priority</label>
                        {isEditing ? (
                          <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
                            {["low", "medium", "high", "critical"].map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        ) : (
                          <span className={cn("text-xs px-2 py-1 rounded-full border", PRIORITY_BG[task.priority])}>
                            <Flag className="w-3 h-3 inline mr-1" />{task.priority}
                          </span>
                        )}
                      </div>

                      {/* Assignees */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Assignees</label>
                        {task.assignees?.length > 0 ? (
                          <div className="space-y-1.5">
                            {task.assignees.map((assignee: any) => (
                              <div key={assignee._id} className="flex items-center gap-2">
                                <img src={assignee.avatar || generateAvatar(assignee.name)} alt={assignee.name}
                                  className="w-5 h-5 rounded-full object-cover" />
                                <span className="text-xs text-foreground">{assignee.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-xs text-muted-foreground">Unassigned</span>}
                      </div>

                      {/* Story Points */}
                      {task.storyPoints && (
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Story Points</label>
                          <span className="text-sm font-bold text-foreground">{task.storyPoints}</span>
                          {task.aiEstimate && task.aiEstimate !== task.storyPoints && (
                            <span className="text-xs text-muted-foreground ml-1.5">(AI: {task.aiEstimate})</span>
                          )}
                        </div>
                      )}

                      {/* Due Date */}
                      {task.dueDate && (
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Due Date</label>
                          <span className={cn("text-xs flex items-center gap-1",
                            new Date(task.dueDate) < new Date() && task.status !== "done" ? "text-red-500" : "text-foreground")}>
                            <Clock className="w-3 h-3" /> {formatDate(task.dueDate, "long")}
                          </span>
                        </div>
                      )}

                      {/* Labels */}
                      {task.labels?.length > 0 && (
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Labels</label>
                          <div className="flex flex-wrap gap-1">
                            {task.labels.map((label: string) => (
                              <span key={label} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reporter */}
                      {task.reporter && (
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Reporter</label>
                          <div className="flex items-center gap-2">
                            <img src={task.reporter.avatar || generateAvatar(task.reporter.name)} alt={task.reporter.name}
                              className="w-5 h-5 rounded-full" />
                            <span className="text-xs text-foreground">{task.reporter.name}</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Created</label>
                        <span className="text-xs text-muted-foreground">{formatDate(task.createdAt, "long")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "comments" && (
                  <div className="p-6 space-y-4">
                    {task.comments?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Start the conversation!</p>
                    )}
                    {task.comments?.map((c: any, i: number) => (
                      <div key={c._id || i} className="flex gap-3">
                        <img src={c.author?.avatar || generateAvatar(c.author?.name || "U")} alt={c.author?.name}
                          className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">{c.author?.name}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(c.createdAt, "relative")}</span>
                          </div>
                          <p className="text-sm text-foreground bg-muted/50 rounded-xl px-3 py-2 leading-relaxed">{c.content}</p>
                        </div>
                      </div>
                    ))}

                    {/* Comment input */}
                    <div className="flex gap-3 pt-2 border-t border-border">
                      <img src={user?.avatar || generateAvatar(user?.name || "U")} alt={user?.name}
                        className="w-7 h-7 rounded-full flex-shrink-0" />
                      <div className="flex-1 flex gap-2">
                        <input value={comment} onChange={(e) => setComment(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                          placeholder="Add a comment... (Enter to send)"
                          className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <button onClick={submitComment} disabled={isCommenting || !comment.trim()}
                          className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50">
                          {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "activity" && (
                  <div className="p-6">
                    <p className="text-sm text-muted-foreground">Activity log coming soon — tracks all status changes, assignments, and edits.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-muted-foreground">Task not found</div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
