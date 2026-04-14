"use client";
import { useEffect, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { taskAPI } from "@/lib/api";
import { cn, PRIORITY_BG, STATUS_LABELS, STATUS_CARD_CLASS, formatDate, generateAvatar } from "@/lib/utils";
import { Plus, MoreHorizontal, Paperclip, MessageCircle, Clock, Flag, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { TaskDetailModal } from "./TaskDetailModal";
import { CreateTaskModal } from "./CreateTaskModal";
import { getSocket, joinProject, leaveProject } from "@/lib/socket";

const COLUMNS = [
  { id: "todo", label: "To Do", color: "#94a3b8" },
  { id: "in_progress", label: "In Progress", color: "#6366f1" },
  { id: "in_review", label: "In Review", color: "#8b5cf6" },
  { id: "done", label: "Done", color: "#22c55e" },
  { id: "blocked", label: "Blocked", color: "#ef4444" },
];

interface KanbanBoardProps {
  projectId: string;
  sprintId?: string;
  filter?: { search: string; priority: string };
}

export function KanbanBoard({ projectId, sprintId, filter }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Record<string, any[]>>({
    todo: [], in_progress: [], in_review: [], done: [], blocked: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [createColumn, setCreateColumn] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = { project: projectId };
      if (sprintId) params.sprint = sprintId;
      const { data } = await taskAPI.getAll(params);
      const grouped: Record<string, any[]> = { todo: [], in_progress: [], in_review: [], done: [], blocked: [] };
      data.forEach((task: any) => {
        const col = task.boardColumn || task.status || "todo";
        if (!grouped[col]) grouped[col] = [];
        grouped[col].push(task);
      });
      Object.keys(grouped).forEach((key) => {
        grouped[key].sort((a, b) => (a.boardOrder || 0) - (b.boardOrder || 0));
      });
      setColumns(grouped);
    } catch (err) {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sprintId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // ─── Real-time socket subscriptions ──────────────────────────────────────
  useEffect(() => {
    joinProject(projectId);
    const socket = getSocket();

    // Another user created a task → add it to the correct column
    const onTaskCreated = (newTask: any) => {
      const col = newTask.boardColumn || newTask.status || "todo";
      setColumns((prev) => ({
        ...prev,
        [col]: [newTask, ...(prev[col] || [])],
      }));
    };

    // A task was updated (title, assignee, priority, etc.)
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

    // A task was dragged to a new column
    const onTaskMoved = ({ taskId, boardColumn, boardOrder, status }: any) => {
      setColumns((prev) => {
        // Find the task in any column
        let movedTask: any = null;
        const next: Record<string, any[]> = {};
        Object.keys(prev).forEach((col) => {
          const filtered = prev[col].filter((t) => {
            if (t._id === taskId) { movedTask = t; return false; }
            return true;
          });
          next[col] = filtered;
        });
        if (movedTask && boardColumn) {
          const col = boardColumn;
          if (!next[col]) next[col] = [];
          const updated = { ...movedTask, boardColumn, status: status || boardColumn };
          next[col] = [...next[col]];
          next[col].splice(Math.min(boardOrder, next[col].length), 0, updated);
        }
        return next;
      });
    };

    socket.on("task:created", onTaskCreated);
    socket.on("task:updated", onTaskUpdated);
    socket.on("task:moved",   onTaskMoved);

    return () => {
      leaveProject(projectId);
      socket.off("task:created", onTaskCreated);
      socket.off("task:updated", onTaskUpdated);
      socket.off("task:moved",   onTaskMoved);
    };
  }, [projectId]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol = Array.from(columns[source.droppableId] || []);
    const dstCol = source.droppableId === destination.droppableId ? srcCol : Array.from(columns[destination.droppableId] || []);
    const [moved] = srcCol.splice(source.index, 1);
    dstCol.splice(destination.index, 0, moved);

    setColumns((prev) => ({
      ...prev,
      [source.droppableId]: srcCol,
      [destination.droppableId]: dstCol,
    }));

    try {
      await taskAPI.updateStatus(draggableId, {
        status: destination.droppableId === "in_progress" ? "in_progress" : destination.droppableId,
        boardColumn: destination.droppableId,
        boardOrder: destination.index,
      });
    } catch {
      toast.error("Failed to update task");
      loadTasks();
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className="kanban-column">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-4 w-24 skeleton" />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="task-card mb-2 h-24 skeleton" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
          {COLUMNS.map((col) => {
            let tasks = columns[col.id] || [];
            
            if (filter) {
              const searchLower = filter.search.toLowerCase();
              tasks = tasks.filter((task) => {
                const searchMatch = !filter.search || 
                  task.title?.toLowerCase().includes(searchLower) || 
                  task.type?.toLowerCase().includes(searchLower) ||
                  task.project?.key?.toLowerCase().includes(searchLower) ||
                  task._id?.toLowerCase().includes(searchLower);
                const priorityMatch = !filter.priority || task.priority === filter.priority;
                return searchMatch && priorityMatch;
              });
            }

            return (
              <div key={col.id} className="kanban-column flex-shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-xs font-semibold text-foreground">{col.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      {tasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setCreateColumn(col.id)}
                    className="p-1 hover:bg-muted rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Droppable */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 min-h-[100px] rounded-xl transition-colors p-1",
                        snapshot.isDraggingOver && "bg-primary/5 ring-1 ring-primary/30"
                      )}
                    >
                      <AnimatePresence>
                        {tasks.map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "task-card mb-2", 
                                  STATUS_CARD_CLASS[task.status] || STATUS_CARD_CLASS.todo,
                                  snapshot.isDragging && "dragging"
                                )}
                                onClick={() => setSelectedTask(task)}
                              >
                                <TaskCard task={task} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add task button */}
                <button
                  onClick={() => setCreateColumn(col.id)}
                  className="w-full mt-2 flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add task
                </button>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask._id}
          onClose={() => setSelectedTask(null)}
          onUpdate={loadTasks}
        />
      )}
      {createColumn && (
        <CreateTaskModal
          projectId={projectId}
          defaultStatus={createColumn}
          sprintId={sprintId}
          onClose={() => setCreateColumn(null)}
          onCreate={() => { setCreateColumn(null); loadTasks(); }}
        />
      )}
    </>
  );
}

function TaskCard({ task }: { task: any }) {
  return (
    <div className="space-y-2">
      {/* Type & ID */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
            task.type === "bug" ? "bg-red-500/15 text-red-400" :
            task.type === "story" ? "bg-blue-500/15 text-blue-400" :
            task.type === "epic" ? "bg-purple-500/15 text-purple-400" :
            "bg-muted text-muted-foreground"
          )}>
            {task.type?.toUpperCase()}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">{task.project?.key || ""}-{task._id?.slice(-4).toUpperCase()}</span>
      </div>

      {/* Title */}
      <p className="text-sm text-foreground leading-snug line-clamp-2">{task.title}</p>

      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.slice(0, 2).map((label: string) => (
            <span key={label} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          {/* Assignee avatars */}
          <div className="flex -space-x-1.5">
            {task.assignees?.slice(0, 3).map((user: any) => (
              <img
                key={user._id}
                src={user.avatar || generateAvatar(user.name)}
                alt={user.name}
                title={user.name}
                className="w-5 h-5 rounded-full border-2 border-card object-cover"
              />
            ))}
          </div>
          {/* Story points */}
          {task.storyPoints && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded font-medium">
              {task.storyPoints}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          {task.comments?.length > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              <MessageCircle className="w-3 h-3" /> {task.comments.length}
            </span>
          )}
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              <Paperclip className="w-3 h-3" /> {task.attachments.length}
            </span>
          )}
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", PRIORITY_BG[task.priority] || "")}>
            <Flag className="w-2.5 h-2.5 inline mr-0.5" />
            {task.priority}
          </span>
        </div>
      </div>

      {/* Due date */}
      {task.dueDate && (
        <div className={cn("flex items-center gap-1 text-[10px]",
          new Date(task.dueDate) < new Date() && task.status !== "done"
            ? "text-red-500"
            : "text-muted-foreground"
        )}>
          <Clock className="w-3 h-3" /> {formatDate(task.dueDate, "short")}
        </div>
      )}
    </div>
  );
}
