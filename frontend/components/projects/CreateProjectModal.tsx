"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useProjectStore } from "@/lib/store/projectStore";
import { PROJECT_COLORS } from "@/lib/utils";
import toast from "react-hot-toast";

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (project: any) => void;
}

export function CreateProjectModal({ onClose, onCreate }: CreateProjectModalProps) {
  const { createProject } = useProjectStore();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", key: "", description: "", type: "scrum",
    isPrivate: false, color: "#6366f1",
  });

  const handleNameChange = (name: string) => {
    const key = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setForm((f) => ({ ...f, name, key }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.key) return toast.error("Name and key are required");
    setIsLoading(true);
    try {
      const project = await createProject(form);
      toast.success("Project created! 🎉");
      onCreate(project);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create project");
    } finally { setIsLoading(false); }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl z-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Create New Project</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Project Name *</label>
              <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Awesome Project" required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Project Key *</label>
                <input type="text" value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toUpperCase().slice(0, 6) }))}
                  placeholder="MAP" required maxLength={6}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Type</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="scrum">Scrum</option>
                  <option value="kanban">Kanban</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What's this project about?" rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Color</label>
              <div className="flex gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => setForm((f) => ({ ...f, color }))}
                    className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${form.color === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>

            {/* Private toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Private Project</p>
                <p className="text-xs text-muted-foreground">Only invited members can see this project</p>
              </div>
              <button type="button" onClick={() => setForm((f) => ({ ...f, isPrivate: !f.isPrivate }))}
                className={`w-10 h-5 rounded-full transition-all relative ${form.isPrivate ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${form.isPrivate ? "left-5" : "left-0.5"}`} />
              </button>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: form.color }}>
                {form.key.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{form.name || "Project Name"}</p>
                <p className="text-xs text-muted-foreground font-mono">{form.key || "KEY"} • {form.type} {form.isPrivate ? "• Private" : ""}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" disabled={isLoading}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-60">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
