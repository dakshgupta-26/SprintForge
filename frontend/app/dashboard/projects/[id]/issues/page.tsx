"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { issueAPI } from "@/lib/api";
import { useProjectStore } from "@/lib/store/projectStore";
import { motion } from "framer-motion";
import { Plus, Bug, AlertCircle } from "lucide-react";
import { cn, PRIORITY_BG, formatDate, generateAvatar } from "@/lib/utils";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";
import { TaskDetailModal } from "@/components/board/TaskDetailModal";

export default function IssuesPage() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, fetchProject } = useProjectStore();
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  useEffect(() => { fetchProject(id); loadIssues(); }, [id]);

  const loadIssues = async () => {
    try {
      const { data } = await issueAPI.getAll(id);
      setIssues(data);
    } catch {} finally { setIsLoading(false); }
  };

  const SEVERITY_COLOR = {
    low: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    critical: "bg-red-500/10 text-red-500 border-red-500/30",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" /> Issues / Bug Tracker
          </h1>
          <p className="text-sm text-muted-foreground">{currentProject?.name} • {issues.length} open issues</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-500/90 transition-all active:scale-95">
          <Plus className="w-4 h-4" /> Report Bug
        </button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">No open issues</p>
          <p className="text-xs text-muted-foreground mt-1">Your bug tracker is clean 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue, i) => (
            <motion.div key={issue._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedIssue(issue._id)}
              className="cursor-pointer p-4 rounded-2xl border border-border bg-card hover:border-red-500/30 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <Bug className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">BUG-{issue._id?.slice(-4).toUpperCase()}</span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", SEVERITY_COLOR[issue.priority as keyof typeof SEVERITY_COLOR])}>
                      {issue.priority}
                    </span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full",
                      issue.status === "done" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground")}>
                      {issue.status?.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-1">{issue.title}</p>
                  {issue.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{issue.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {issue.assignees?.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <img src={issue.assignees[0]?.avatar || generateAvatar(issue.assignees[0]?.name)} alt=""
                          className="w-4 h-4 rounded-full" />
                        {issue.assignees[0]?.name}
                      </div>
                    )}
                    <span>{formatDate(issue.createdAt, "relative")}</span>
                    {issue.comments?.length > 0 && <span>💬 {issue.comments.length}</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTaskModal projectId={id} defaultStatus="todo" defaultType="bug" onClose={() => setShowCreate(false)}
          onCreate={() => { setShowCreate(false); loadIssues(); }} />
      )}

      {selectedIssue && (
        <TaskDetailModal taskId={selectedIssue} onClose={() => setSelectedIssue(null)} onUpdate={loadIssues} />
      )}
    </div>
  );
}
