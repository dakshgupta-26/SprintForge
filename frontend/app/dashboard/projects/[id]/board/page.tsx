"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useProjectStore } from "@/lib/store/projectStore";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";
import { motion } from "framer-motion";
import { Plus, Filter, Search, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sprintAPI } from "@/lib/api";

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { currentProject } = useProjectStore();
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState({ priority: "", search: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    sprintAPI
      .getAll(id)
      .then((res) => {
        const active = res.data.find((s: any) => s.status === "active");
        setActiveSprint(active || null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">Loading project workspace...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {activeSprint ? `Sprint: ${activeSprint.name}` : "Kanban Board"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentProject?.name} • {currentProject?.type?.toUpperCase()} Board
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Filter tasks..."
              value={filter.search}
              onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
              className="pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn("flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm transition-colors", showFilters || filter.priority ? "border-primary text-primary bg-primary/5" : "border-border hover:bg-muted text-foreground")}
            >
              <Filter className="w-4 h-4" /> Filters {filter.priority && " (1)"}
            </button>
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 p-2">
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 pt-1">PRIORITY</div>
                <div className="space-y-1">
                  {["urgent", "high", "medium", "low"].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setFilter((f) => ({ ...f, priority: f.priority === p ? "" : p }));
                        setShowFilters(false);
                      }}
                      className={cn("w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-muted transition-colors capitalize flex items-center justify-between", filter.priority === p ? "bg-primary/10 text-primary font-medium" : "text-foreground")}
                    >
                      {p}
                      {filter.priority === p && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
                {filter.priority && (
                  <button onClick={() => setFilter(f => ({ ...f, priority: "" }))} className="w-full text-center mt-2 pt-2 border-t border-border text-xs text-muted-foreground hover:text-foreground">
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </motion.div>

      {/* Sprint info bar */}
      {activeSprint && (
        <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 text-sm flex-shrink-0">
          <span className="text-primary font-medium">🏃 Active Sprint</span>
          <span className="text-foreground font-semibold">{activeSprint.name}</span>
          <span className="text-muted-foreground">{activeSprint.goal}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(activeSprint.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} →
            {Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / 86400000))} days left
          </span>
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={id} sprintId={activeSprint?._id} filter={filter} />
      </div>

      {showCreate && (
        <CreateTaskModal
          projectId={id}
          sprintId={activeSprint?._id}
          onClose={() => setShowCreate(false)}
          onCreate={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
