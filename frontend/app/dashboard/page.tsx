"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { useProjectStore } from "@/lib/store/projectStore";
import { useRouter } from "next/navigation";
import { projectAPI, taskAPI } from "@/lib/api";
import { formatDate, PRIORITY_BG } from "@/lib/utils";
import toast from "react-hot-toast";
import { CreateTaskModal } from "@/components/shared/CreateTaskModal";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import {
  FolderKanban, Zap, CheckCircle2, Clock, AlertCircle, Plus,
  TrendingUp, Users, ArrowRight, BarChart3, Flame, KeyRound, Loader2
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { projects } = useProjectStore();
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, done: 0, inProgress: 0, overdue: 0 });
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await taskAPI.getAll({ assignee: user?._id });
        setMyTasks(data.slice(0, 8));
        const now = new Date();
        setStats({
          total: data.length,
          done: data.filter((t: any) => t.status === "done").length,
          inProgress: data.filter((t: any) => t.status === "in_progress").length,
          overdue: data.filter((t: any) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done").length,
        });
      } catch {}
    };
    if (user?._id) load();
  }, [user?._id]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      const { data } = await projectAPI.joinWithCode(joinCode);
      toast.success(data.message);
      setJoinCode("");
      router.push(`/dashboard/projects/${data.projectId}/board`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to join project");
    } finally {
      setIsJoining(false);
    }
  };

  const statCards = [
    { label: "Total tasks", value: stats.total, icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "In Progress", value: stats.inProgress, icon: Zap, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Completed", value: stats.done, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Overdue", value: stats.overdue, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <>
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening across your projects today.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-2xl font-black text-foreground">{card.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{card.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">My Tasks</h2>
            <Link href="/dashboard/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">No tasks assigned to you</p>
              <p className="text-xs text-muted-foreground mt-1">Tasks assigned to you will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myTasks.map((task) => (
                <Link
                  key={task._id}
                  href={`/dashboard/tasks/${task._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === "done" ? "bg-green-500" : task.status === "in_progress" ? "bg-blue-500" : "bg-muted-foreground"}`} />
                  <span className={`flex-1 text-sm truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${PRIORITY_BG[task.priority]}`}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className={`text-xs flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? "text-red-500" : "text-muted-foreground"}`}>
                      <Clock className="w-3 h-3" /> {formatDate(task.dueDate, "short")}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Projects sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground">Projects</h2>
              <Link href="/dashboard/projects" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {projects.length === 0 ? (
              <Link
                href="/dashboard/projects/new"
                className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-sm text-muted-foreground hover:text-primary"
              >
                <Plus className="w-4 h-4" /> Create your first project
              </Link>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 5).map((project) => (
                  <Link
                    key={project._id}
                    href={`/dashboard/projects/${project._id}/board`}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    >
                      {project.key.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.type} • {project.members?.length} members</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-1.5">
              {/* New Task → opens modal */}
              <button
                id="qa-new-task"
                onClick={() => setShowNewTask(true)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors text-sm text-left"
              >
                <Plus className="w-4 h-4 text-primary" />
                <span className="text-foreground">New Task</span>
              </button>

              {/* New Project → opens modal */}
              <button
                id="qa-new-project"
                onClick={() => setShowNewProject(true)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors text-sm text-left"
              >
                <FolderKanban className="w-4 h-4 text-violet-500" />
                <span className="text-foreground">New Project</span>
              </button>

              {/* View Analytics → navigates to /dashboard/analytics */}
              <Link
                id="qa-view-analytics"
                href="/dashboard/analytics"
                className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors text-sm"
              >
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-foreground">View Analytics</span>
              </Link>

              {/* Invite Team → navigates to /dashboard/team */}
              <Link
                id="qa-invite-team"
                href="/dashboard/team"
                className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors text-sm"
              >
                <Users className="w-4 h-4 text-orange-500" />
                <span className="text-foreground">Invite Team</span>
              </Link>
            </div>
          </div>

           {/* Join via Code */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <h2 className="font-bold text-primary flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4" /> Join via Code
            </h2>
            <form onSubmit={handleJoinWithCode} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="flex-1 px-3 py-2 rounded-xl text-sm border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase font-mono tracking-widest placeholder:tracking-normal"
              />
              <button
                type="submit"
                disabled={isJoining || joinCode.length < 3}
                className="px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>

      {/* ── Modals ── */}
      {showNewTask && (
        <CreateTaskModal
          onClose={() => setShowNewTask(false)}
          onCreated={(task) => {
            setShowNewTask(false);
            if (task?.project) {
              const pid = typeof task.project === "string" ? task.project : task.project._id;
              router.push(`/dashboard/projects/${pid}/board`);
            }
          }}
        />
      )}

      {showNewProject && (
        <CreateProjectModal
          onClose={() => setShowNewProject(false)}
          onCreate={(project) => {
            setShowNewProject(false);
            router.push(`/dashboard/projects/${project._id}/board`);
          }}
        />
      )}
    </>
  );
}
