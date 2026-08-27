"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { taskAPI } from "@/lib/api";
import { Plus, MoreHorizontal, AlertTriangle, Layers, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { TaskCard } from "./TaskCard";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { getSocket, joinProject, leaveProject } from "@/lib/socket";

const COLUMNS = [
  { id: "todo", label: "To Do", color: "#94a3b8", wipLimit: 8 },
  { id: "in_progress", label: "In Progress", color: "#6366f1", wipLimit: 5 },
  { id: "review", label: "In Review", color: "#8b5cf6", wipLimit: 4 },
  { id: "done", label: "Done", color: "#22c55e" },
  { id: "blocked", label: "Blocked", color: "#f43f5e", wipLimit: 3 },
];

interface KanbanBoardProps {
  projectId: string;
  sprintId?: string;
  searchQuery?: string;
  quickFilter?: string;
  priorityFilter?: string;
  sortBy?: string;
  density?: "comfortable" | "compact";
  projectMembers?: any[];
  sprints?: any[];
  currentUser?: any;
  onCountsChange?: (counts: any) => void;
}

export function KanbanBoard({
  projectId,
  sprintId,
  searchQuery = "",
  quickFilter = "all",
  priorityFilter = "all",
  sortBy = "default",
  density = "comfortable",
  projectMembers = [],
  sprints = [],
  currentUser,
  onCountsChange,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<Record<string, any[]>>({
    todo: [],
    in_progress: [],
    review: [],
    done: [],
    blocked: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Inline Quick Add per column
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = { project: projectId };
      if (sprintId) params.sprint = sprintId;

      const { data } = await taskAPI.getAll(params);
      const grouped: Record<string, any[]> = {
        todo: [],
        in_progress: [],
        review: [],
        done: [],
        blocked: [],
      };

      data.forEach((task: any) => {
        let col = task.boardColumn || task.status || "todo";
        if (col === "in_review") col = "review";
        if (!grouped[col]) grouped[col] = [];
        grouped[col].push(task);
      });

      Object.keys(grouped).forEach((key) => {
        grouped[key].sort((a, b) => (a.boardOrder || 0) - (b.boardOrder || 0));
      });

      setColumns(grouped);
    } catch {
      toast.error("Failed to load board tasks");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sprintId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ── Real-Time Socket.IO Synchronization ──
  useEffect(() => {
    joinProject(projectId);
    const socket = getSocket();
    if (!socket) return;

    const onTaskCreated = (newTask: any) => {
      let col = newTask.boardColumn || newTask.status || "todo";
      if (col === "in_review") col = "review";
      setColumns((prev) => {
        const exists = Object.values(prev).some((list) =>
          list.some((t: any) => t._id === newTask._id)
        );
        if (exists) return prev;
        return {
          ...prev,
          [col]: [newTask, ...(prev[col] || [])],
        };
      });
    };

    const onTaskUpdated = (updated: any) => {
      setColumns((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((col) => {
          next[col] = next[col].map((t) =>
            t._id === updated._id ? { ...t, ...updated } : t
          );
        });
        return next;
      });
    };

    const onTaskMoved = ({ taskId, boardColumn, boardOrder, status }: any) => {
      setColumns((prev) => {
        let movedTask: any = null;
        const next: Record<string, any[]> = {};
        Object.keys(prev).forEach((col) => {
          next[col] = prev[col].filter((t) => {
            if (t._id === taskId) {
              movedTask = t;
              return false;
            }
            return true;
          });
        });

        if (movedTask && boardColumn) {
          let col = boardColumn;
          if (col === "in_review") col = "review";
          if (!next[col]) next[col] = [];
          const updated = { ...movedTask, boardColumn: col, status: status || col };
          next[col] = [...next[col]];
          next[col].splice(Math.min(boardOrder || 0, next[col].length), 0, updated);
        }
        return next;
      });
    };

    socket.on("task:created", onTaskCreated);
    socket.on("task:updated", onTaskUpdated);
    socket.on("task:moved", onTaskMoved);

    return () => {
      leaveProject(projectId);
      socket.off("task:created", onTaskCreated);
      socket.off("task:updated", onTaskUpdated);
      socket.off("task:moved", onTaskMoved);
    };
  }, [projectId]);

  // ── Drag and Drop Handler ──
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const previousColumns = { ...columns };

    const srcCol = Array.from(columns[source.droppableId] || []);
    const dstCol =
      source.droppableId === destination.droppableId
        ? srcCol
        : Array.from(columns[destination.droppableId] || []);

    const [moved] = srcCol.splice(source.index, 1);
    dstCol.splice(destination.index, 0, moved);

    setColumns((prev) => ({
      ...prev,
      [source.droppableId]: srcCol,
      [destination.droppableId]: dstCol,
    }));

    try {
      await taskAPI.updateStatus(draggableId, {
        status: destination.droppableId,
        boardColumn: destination.droppableId,
        boardOrder: destination.index,
      });
    } catch {
      toast.error("Failed to move task. Position reverted.");
      setColumns(previousColumns);
    }
  };

  // ── Inline Quick Add Handler ──
  const handleQuickAdd = async (columnId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setIsQuickAdding(true);
    try {
      const { data: newTask } = await taskAPI.create({
        title: quickTitle.trim(),
        type: "task",
        priority: "medium",
        project: projectId,
        sprint: sprintId || undefined,
        status: columnId,
        boardColumn: columnId,
      });
      setColumns((prev) => ({
        ...prev,
        [columnId]: [...(prev[columnId] || []), newTask],
      }));
      setQuickTitle("");
      setQuickAddColumn(null);
      toast.success("Task added to board! 🚀");
    } catch {
      toast.error("Failed to create task");
    } finally {
      setIsQuickAdding(false);
    }
  };

  // ── Filter and Sort Helpers ──
  const filterAndSortTasks = (tasks: any[]) => {
    return tasks
      .filter((task) => {
        // Search
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const titleMatch = task.title?.toLowerCase().includes(q);
          const descMatch = task.description?.toLowerCase().includes(q);
          const keyMatch = `SFG-${task._id?.slice(-4).toLowerCase()}`.includes(q);
          const assigneeMatch = task.assignees?.some((a: any) =>
            a.name?.toLowerCase().includes(q)
          );
          if (!titleMatch && !descMatch && !keyMatch && !assigneeMatch) return false;
        }

        // Priority filter
        if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

        // Quick filter
        if (quickFilter === "my_tasks") {
          const isMe = task.assignees?.some(
            (a: any) => (typeof a === "object" ? a._id : a) === currentUser?._id
          );
          if (!isMe) return false;
        } else if (quickFilter === "unassigned") {
          if (task.assignees && task.assignees.length > 0) return false;
        } else if (quickFilter === "high") {
          if (task.priority !== "critical" && task.priority !== "high") return false;
        } else if (quickFilter === "bugs") {
          if (task.type !== "bug") return false;
        } else if (quickFilter === "blocked") {
          if (task.status !== "blocked" && task.priority !== "critical") return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          const weight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
          return (weight[b.priority] || 0) - (weight[a.priority] || 0);
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "points") {
          return (b.storyPoints || 0) - (a.storyPoints || 0);
        }
        return (a.boardOrder || 0) - (b.boardOrder || 0);
      });
  };

  // Calculate metrics for Toolbar
  useEffect(() => {
    if (!onCountsChange) return;
    let all = 0;
    let myTasks = 0;
    let unassigned = 0;
    let high = 0;
    let bugs = 0;
    let blocked = 0;

    Object.values(columns).forEach((tasks) => {
      tasks.forEach((t) => {
        all++;
        if (t.assignees?.some((a: any) => (typeof a === "object" ? a._id : a) === currentUser?._id)) {
          myTasks++;
        }
        if (!t.assignees || t.assignees.length === 0) unassigned++;
        if (t.priority === "critical" || t.priority === "high") high++;
        if (t.type === "bug") bugs++;
        if (t.status === "blocked" || t.priority === "critical") blocked++;
      });
    });

    onCountsChange({ all, myTasks, unassigned, high, bugs, blocked });
  }, [columns, currentUser?._id, onCountsChange]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="w-[280px] sm:w-[300px] flex-shrink-0 p-4 rounded-3xl bg-[#090d1f] border border-white/[0.06] space-y-3"
          >
            <div className="h-6 w-24 bg-white/[0.04] rounded-lg animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[600px] scrollbar-thin">
          {COLUMNS.map((col) => {
            const rawTasks = columns[col.id] || [];
            const tasks = filterAndSortTasks(rawTasks);
            const isOverWIP = col.wipLimit && rawTasks.length > col.wipLimit;

            return (
              <div
                key={col.id}
                className="w-[280px] sm:w-[300px] flex-shrink-0 flex flex-col rounded-3xl bg-[#070b1a] border border-white/[0.08] shadow-lg p-3 space-y-3"
              >
                {/* ── Column Header ── */}
                <div className="flex items-center justify-between px-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: col.color }}
                    />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      {col.label}
                    </h3>
                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-white/[0.06] px-2 py-0.2 rounded-full">
                      {tasks.length}
                    </span>
                  </div>

                  {/* WIP Badge & Add Button */}
                  <div className="flex items-center gap-1.5">
                    {col.wipLimit && (
                      <span
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.2 rounded-full border",
                          isOverWIP
                            ? "text-rose-400 bg-rose-500/10 border-rose-500/30 font-bold"
                            : "text-slate-500 bg-white/[0.03] border-white/[0.06]"
                        )}
                        title={`WIP Limit: ${col.wipLimit}`}
                      >
                        WIP {rawTasks.length}/{col.wipLimit}
                      </span>
                    )}

                    <button
                      onClick={() => setQuickAddColumn(col.id)}
                      className="p-1 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Quick add task to this column"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ── Inline Quick Add Input (if active for this column) ── */}
                {quickAddColumn === col.id && (
                  <form
                    onSubmit={(e) => handleQuickAdd(col.id, e)}
                    className="p-2.5 rounded-2xl bg-[#090d1f] border border-violet-500/40 space-y-2 shadow-md"
                  >
                    <input
                      type="text"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder="Task title... (Press Enter)"
                      autoFocus
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#060914] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-violet-500/70"
                    />
                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setQuickAddColumn(null);
                          setQuickTitle("");
                        }}
                        className="px-2 py-0.5 text-slate-400 hover:text-white text-[11px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isQuickAdding || !quickTitle.trim()}
                        className="px-3 py-1 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold disabled:opacity-50"
                      >
                        {isQuickAdding ? "Adding..." : "Add"}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── Droppable Zone ── */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 min-h-[140px] space-y-2.5 rounded-2xl transition-all p-1",
                        snapshot.isDraggingOver &&
                          "bg-violet-500/10 border border-dashed border-violet-500/40"
                      )}
                    >
                      {tasks.length === 0 && !snapshot.isDraggingOver ? (
                        <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-white/[0.04] rounded-2xl text-[11px] font-mono text-slate-600">
                          <span>No tasks in {col.label}</span>
                          <button
                            onClick={() => setQuickAddColumn(col.id)}
                            className="text-violet-400 hover:underline mt-1 font-sans text-xs cursor-pointer"
                          >
                            + Add task
                          </button>
                        </div>
                      ) : (
                        tasks.map((task, index) => (
                          <Draggable
                            key={task._id}
                            draggableId={task._id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "transition-shadow",
                                  snapshot.isDragging &&
                                    "shadow-[0_15px_35px_rgba(0,0,0,0.8)] scale-[1.02] opacity-95 z-50"
                                )}
                              >
                                <TaskCard
                                  task={task}
                                  density={density}
                                  onClick={() => setSelectedTaskId(task._id)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Bottom Add Task Button */}
                <button
                  onClick={() => setQuickAddColumn(col.id)}
                  className="w-full py-2 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-dashed border-white/[0.06] hover:border-white/[0.12] text-xs font-semibold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add task</span>
                </button>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        isOpen={!!selectedTaskId}
        taskId={selectedTaskId}
        projectId={projectId}
        projectMembers={projectMembers}
        sprints={sprints}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={loadTasks}
        onTaskDeleted={loadTasks}
      />
    </>
  );
}
