"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sprintAPI, taskAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Calendar, ArrowLeft, Target, Play, CheckCircle, Trash2, Settings, Flag, ExternalLink, Loader2 } from "lucide-react";
import { cn, formatDate, statusColor, PRIORITY_BG } from "@/lib/utils";
import toast from "react-hot-toast";
import { TaskDetailModal } from "@/components/board/TaskDetailModal";

export default function SprintDetailPage() {
  const { id: projectId, sprintId } = useParams<{ id: string; sprintId: string }>();
  const router = useRouter();
  const [sprint, setSprint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", startDate: "", endDate: "" });

  useEffect(() => { loadSprint(); }, [sprintId]);

  const loadSprint = async () => {
    try {
      setIsLoading(true);
      const { data } = await sprintAPI.getOne(sprintId);
      setSprint(data);
      setEditForm({ name: data.name, startDate: data.startDate?.split("T")[0] || "", endDate: data.endDate?.split("T")[0] || "" });
    } catch {
      toast.error("Failed to load sprint details");
      router.push(`/dashboard/projects/${projectId}/sprints`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await sprintAPI.update(sprintId, editForm);
      toast.success("Sprint updated");
      setIsEditing(false);
      loadSprint();
    } catch { toast.error("Failed to update sprint"); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this sprint? The tasks will safely return to the backlog.")) return;
    try {
      await sprintAPI.delete(sprintId);
      toast.success("Sprint deleted");
      router.push(`/dashboard/projects/${projectId}/sprints`);
    } catch { toast.error("Failed to delete sprint"); }
  };

  const startSprint = async () => {
    try { await sprintAPI.start(sprintId); toast.success("Sprint started! 🚀"); loadSprint(); }
    catch { toast.error("Failed to start sprint"); }
  };

  const completeSprint = async () => {
    if (!window.confirm("Complete this sprint? Unfinished tasks will auto-roll into the backlog.")) return;
    try { await sprintAPI.complete(sprintId); toast.success("Sprint completed! 🎉"); loadSprint(); }
    catch { toast.error("Failed to complete sprint"); }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sprint) return null;

  const totalTasks = sprint.tasks?.length || 0;
  const completedTasks = sprint.tasks?.filter((t: any) => t.status === "done").length || 0;
  const remainingTasks = totalTasks - completedTasks;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const metrics = [
    { label: "Total Tasks", val: totalTasks },
    { label: "Completed", val: completedTasks },
    { label: "Remaining", val: remainingTasks },
    { label: "Velocity Limit", val: sprint.velocity || sprint.completedPoints || sprint.totalPoints || "0 pts" }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <button onClick={() => router.push(`/dashboard/projects/${projectId}/sprints`)} className="hover:text-foreground flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Sprints
          </button>
          <span>/</span>
          <span className="font-bold text-foreground truncate">{sprint.name}</span>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", statusColor[sprint.status as keyof typeof statusColor])}>
            {sprint.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sprint.status === "planning" && (
            <button onClick={startSprint} className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 text-green-500 rounded-lg text-sm font-bold hover:bg-green-500/20 transition-all">
              <Play className="w-4 h-4" /> Start Sprint
            </button>
          )}
          {sprint.status === "active" && (
            <button onClick={completeSprint} className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg text-sm font-bold hover:bg-blue-500/20 transition-all shadow-md shadow-blue-500/20">
              <CheckCircle className="w-4 h-4" /> Complete Sprint
            </button>
          )}
          <button onClick={() => setIsEditing(!isEditing)} className="p-2 ml-4 rounded-xl hover:bg-muted text-muted-foreground transition-all">
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={handleDelete} className="p-2 rounded-xl border border-red-500/30 hover:bg-red-500/10 text-red-500 transition-all">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editor Hook */}
      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-muted/30 border border-border rounded-2xl overflow-hidden">
            <h3 className="font-bold text-sm mb-3">Sprint Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div><label className="text-xs text-muted-foreground mb-1 block">Sprint Name</label><input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 bg-card border rounded-lg text-sm" /></div>
               <div><label className="text-xs text-muted-foreground mb-1 block">Start Date</label><input type="date" value={editForm.startDate} onChange={(e) => setEditForm({...editForm, startDate: e.target.value})} className="w-full px-3 py-2 bg-card border rounded-lg text-sm" /></div>
               <div><label className="text-xs text-muted-foreground mb-1 block">End Date</label><input type="date" value={editForm.endDate} onChange={(e) => setEditForm({...editForm, endDate: e.target.value})} className="w-full px-3 py-2 bg-card border rounded-lg text-sm" /></div>
            </div>
            <div className="flex gap-2 mt-4"><button onClick={handleUpdate} className="px-4 py-2 bg-primary text-white text-sm rounded-lg font-medium">Save Changes</button><button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Task List Space */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
             <h2 className="text-lg font-bold">Assigned Tasks ({totalTasks})</h2>
          </div>
          {sprint.tasks?.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl">
              <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">Sprint backlog is empty</p>
              <p className="text-xs text-muted-foreground mt-1">Visit your Project Board to pull stories into this sprint.</p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
              {sprint.tasks?.map((task: any) => (
                <div key={task._id} onClick={() => setSelectedTask(task._id)}
                     className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 w-1/2">
                    <span className="text-xs font-mono text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">SFG-{task._id.slice(-4).toUpperCase()}</span>
                    <span className={cn("text-[10px] w-2 h-2 rounded-full", task.type === "bug" ? "bg-red-500" : "bg-blue-500")} />
                    <span className={cn("text-sm font-medium truncate", task.status === "done" && "line-through text-muted-foreground")}>{task.title}</span>
                  </div>
                  <div className="flex items-center gap-5">
                     <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", PRIORITY_BG[task.priority])}><Flag className="w-3 h-3 inline mr-1" />{task.priority}</span>
                     <span className={cn("text-[10px] px-2 py-0.5 rounded-full capitalize", task.status === "done" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground")}>{task.status.replace("_", " ")}</span>
                     {task.assignees?.length > 0 ? (
                        <div className="flex -space-x-2">
                           {task.assignees.map((a: any) => <img key={a._id} src={a.avatar || `https://ui-avatars.com/api/?name=${a.name}`} className="w-6 h-6 rounded-full border-2 border-card" alt={a.name} title={a.name} />)}
                        </div>
                     ) : <span className="text-xs text-muted-foreground px-1 border border-dashed rounded opacity-50">Unassigned</span>}
                     <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics sidebar */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-border bg-card relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5"><Target className="w-16 h-16" /></div>
             <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Sprint Timeline</h3>
             <div className="space-y-3">
               <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Start Date</label>
                  <div className="flex items-center gap-2 text-sm text-foreground"><Calendar className="w-4 h-4 text-green-500" /> {formatDate(sprint.startDate, "long")}</div>
               </div>
               <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">End Date</label>
                  <div className="flex items-center gap-2 text-sm text-foreground"><Calendar className="w-4 h-4 text-red-500" /> {formatDate(sprint.endDate, "long")}</div>
               </div>
             </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card">
             <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Progress Matrix</h3>
             <div className="flex items-end gap-1 mb-2">
                <span className="text-3xl font-black">{progress}%</span><span className="text-sm text-muted-foreground mb-1">completed</span>
             </div>
             <div className="w-full h-2.5 bg-muted rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }} />
             </div>
             <div className="space-y-3">
               {metrics.map((m, i) => (
                  <div key={i} className="flex justify-between items-center pb-2 border-b border-border/50 last:border-0 last:pb-0">
                     <span className="text-sm text-muted-foreground">{m.label}</span>
                     <span className="text-sm font-bold">{m.val}</span>
                  </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal taskId={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={loadSprint} />
      )}
    </div>
  );
}
