"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sprintAPI, taskAPI } from "@/lib/api";
import { useProjectStore } from "@/lib/store/projectStore";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Play, CheckCircle, Calendar, Target, Zap, X, Loader2, ArrowRight } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";

export default function SprintsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentProject, fetchProject } = useProjectStore();
  const [sprints, setSprints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedSprint, setExpandedSprint] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", goal: "", startDate: "", endDate: "" });

  useEffect(() => { fetchProject(id); loadSprints(); }, [id]);

  const loadSprints = async () => {
    try {
      setIsLoading(true);
      const { data } = await sprintAPI.getAll(id);
      setSprints(data);
      const active = data.find((s: any) => s.status === "active");
      if (active) setExpandedSprint(active._id);
    } catch {
      toast.error("Failed to load sprints");
    } finally {
      setIsLoading(false);
    }
  };

  const createSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error("End date must be after start date");
      return;
    }
    try {
      await sprintAPI.create({ ...form, project: id });
      toast.success("Sprint created!");
      setShowCreate(false);
      setForm({ name: "", goal: "", startDate: "", endDate: "" });
      loadSprints();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create sprint");
    }
  };

  const startSprint = async (sprintId: string) => {
    try {
      await sprintAPI.start(sprintId);
      toast.success("Sprint started! 🚀");
      loadSprints();
    } catch { toast.error("Failed to start sprint"); }
  };

  const completeSprint = async (sprintId: string) => {
    if (!window.confirm("Complete this sprint? Incomplete tasks will be moved to the backlog.")) return;
    try {
      await sprintAPI.complete(sprintId);
      toast.success("Sprint completed! 🎉");
      loadSprints();
    } catch { toast.error("Failed to complete sprint"); }
  };

  const statusColor = { planning: "text-yellow-500 bg-yellow-500/10", active: "text-green-500 bg-green-500/10", completed: "text-gray-500 bg-gray-500/10" };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Sprints</h1>
          <p className="text-sm text-muted-foreground">{currentProject?.name} • Manage your sprint cycles</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all active:scale-95">
          <Plus className="w-4 h-4" /> New Sprint
        </button>
      </div>

      {/* Create sprint modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-2xl border border-primary/30 bg-primary/5">
            <h3 className="font-bold mb-4">New Sprint</h3>
            <form onSubmit={createSprint} className="space-y-3">
              <input type="text" placeholder="Sprint name (e.g. Sprint 12)" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="text" placeholder="Sprint goal (optional)" value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">End date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 border border-border rounded-xl text-sm hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all">
                  Create Sprint
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sprint list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : sprints.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground">No sprints yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first sprint to start planning</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sprints.map((sprint) => {
            const isExpanded = expandedSprint === sprint._id;
            const completedTasks = sprint.tasks?.filter((t: any) => t.status === "done").length || 0;
            const totalTasks = sprint.tasks?.length || 0;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <motion.div key={sprint._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => router.push(`/dashboard/projects/${id}/sprints/${sprint._id}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground">{sprint.name}</h3>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", statusColor[sprint.status as keyof typeof statusColor])}>
                        {sprint.status}
                      </span>
                    </div>
                    {sprint.goal && <p className="text-sm text-muted-foreground truncate">{sprint.goal}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(sprint.startDate, "short")} – {formatDate(sprint.endDate, "short")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {totalTasks} tasks • {completedTasks} done
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="hidden md:flex flex-col items-end gap-1.5 flex-shrink-0 w-32">
                    <span className="text-xs font-medium text-foreground">
                      {totalTasks === 0 ? "No tasks yet" : `${progress}%`}
                    </span>
                    <div className="w-full h-1.5 bg-muted rounded-full">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{sprint.velocity || sprint.completedPoints || 0} pts velocity</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {sprint.status === "planning" && (
                      <button onClick={() => startSprint(sprint._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors">
                        <Play className="w-3 h-3" /> Start
                      </button>
                    )}
                    {sprint.status === "active" && (
                      <button onClick={() => completeSprint(sprint._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors">
                        <CheckCircle className="w-3 h-3" /> Complete
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
