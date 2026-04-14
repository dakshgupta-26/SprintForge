"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { taskAPI, sprintAPI } from "@/lib/api";
import { useProjectStore } from "@/lib/store/projectStore";
import { motion } from "framer-motion";
import { Plus, AlignLeft, Zap, ArrowRight, Flag } from "lucide-react";
import { cn, PRIORITY_BG, formatDate } from "@/lib/utils";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";
import toast from "react-hot-toast";

export default function BacklogPage() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, fetchProject } = useProjectStore();
  const [backlog, setBacklog] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [movingTask, setMovingTask] = useState<string | null>(null);

  useEffect(() => { fetchProject(id); loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [backlogRes, sprintsRes] = await Promise.all([
        taskAPI.getBacklog(id),
        sprintAPI.getAll(id),
      ]);
      setBacklog(backlogRes.data);
      setSprints(sprintsRes.data.filter((s: any) => s.status !== "completed"));
    } catch { toast.error("Failed to load backlog"); } finally { setIsLoading(false); }
  };

  const moveToSprint = async (taskId: string, sprintId: string) => {
    setMovingTask(taskId);
    try {
      await sprintAPI.addTask(sprintId, taskId);
      setBacklog((prev) => prev.filter((t) => t._id !== taskId));
      toast.success("Task moved to sprint!");
    } catch { toast.error("Failed to move task"); } finally { setMovingTask(null); }
  };

  const activeSprint = sprints.find((s) => s.status === "active");
  const planningSprints = sprints.filter((s) => s.status === "planning");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Backlog</h1>
          <p className="text-sm text-muted-foreground">{currentProject?.name} • {backlog.length} items</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all active:scale-95">
          <Plus className="w-4 h-4" /> Add to Backlog
        </button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}
        </div>
      ) : backlog.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <AlignLeft className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">Backlog is empty</p>
          <p className="text-xs text-muted-foreground mt-1">All unassigned tasks will appear here</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm hover:bg-primary/20 transition-colors">
            <Plus className="w-4 h-4" /> Create task
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Backlog</span>
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{backlog.length}</span>
            {(activeSprint || planningSprints.length > 0) && (
              <span className="ml-auto text-xs text-muted-foreground">
                Drag tasks or use "→ Sprint" to move
              </span>
            )}
          </div>
          <div className="divide-y divide-border">
            {backlog.map((task, i) => (
              <motion.div key={task._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                  task.type === "bug" ? "bg-red-500" : task.type === "story" ? "bg-blue-500" : "bg-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase">{task.type}</span>
                    {task.dueDate && (
                      <span className="text-[10px] text-muted-foreground">{formatDate(task.dueDate, "short")}</span>
                    )}
                  </div>
                </div>
                {task.storyPoints && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-medium text-muted-foreground">{task.storyPoints} pts</span>
                )}
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", PRIORITY_BG[task.priority])}>
                  <Flag className="w-2.5 h-2.5 inline" /> {task.priority}
                </span>

                {/* Move to sprint */}
                {(activeSprint || planningSprints.length > 0) && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {activeSprint && (
                      <button onClick={() => moveToSprint(task._id, activeSprint._id)}
                        disabled={movingTask === task._id}
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors font-medium">
                        <Zap className="w-2.5 h-2.5" /> Active Sprint
                      </button>
                    )}
                    {planningSprints[0] && (
                      <button onClick={() => moveToSprint(task._id, planningSprints[0]._id)}
                        disabled={movingTask === task._id}
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
                        <ArrowRight className="w-2.5 h-2.5" /> {planningSprints[0].name}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateTaskModal projectId={id} onClose={() => setShowCreate(false)}
          onCreate={() => { setShowCreate(false); loadData(); }} />
      )}
    </div>
  );
}
