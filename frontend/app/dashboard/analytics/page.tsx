"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useProjectStore } from "@/lib/store/projectStore";
import { analyticsAPI } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  BarChart3, TrendingUp, CheckCircle2, Clock, Users2,
  FolderKanban, ArrowRight, Zap, Loader2
} from "lucide-react";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#22c55e", "#f59e0b", "#ef4444"];

interface ProjectStat {
  projectId: string;
  projectName: string;
  projectColor: string;
  projectKey: string;
  total: number;
  done: number;
  inProgress: number;
  avgCycleTime: number;
  members: number;
  velocity: number;
}

export default function GlobalAnalyticsPage() {
  const { projects, fetchProjects } = useProjectStore();
  const [stats, setStats] = useState<ProjectStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length === 0) {
      setIsLoading(false);
      return;
    }
    loadAnalytics();
  }, [projects]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled(
        projects.map((p) => analyticsAPI.getProject(p._id))
      );

      const parsed: ProjectStat[] = results.map((result, i) => {
        const project = projects[i];
        if (result.status === "fulfilled") {
          const data = result.value.data;
          const velocity = (data.velocity || []).slice(-1)[0]?.completed || 0;
          return {
            projectId: project._id,
            projectName: project.name,
            projectColor: project.color,
            projectKey: project.key,
            total: data.totalTasks || 0,
            done: data.completedTasks || 0,
            inProgress: data.inProgressTasks || 0,
            avgCycleTime: Math.round(data.avgCycleTime || 0),
            members: project.members?.length || 1,
            velocity,
          };
        }
        return {
          projectId: project._id,
          projectName: project.name,
          projectColor: project.color,
          projectKey: project.key,
          total: 0, done: 0, inProgress: 0,
          avgCycleTime: 0, members: project.members?.length || 1, velocity: 0,
        };
      });

      setStats(parsed);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Derived totals ─── */
  const filtered = selectedProject === "all"
    ? stats
    : stats.filter((s) => s.projectId === selectedProject);

  const totals = filtered.reduce(
    (acc, s) => ({
      total: acc.total + s.total,
      done: acc.done + s.done,
      inProgress: acc.inProgress + s.inProgress,
    }),
    { total: 0, done: 0, inProgress: 0 }
  );
  const completionRate = totals.total > 0
    ? Math.round((totals.done / totals.total) * 100) : 0;

  /* ─── Chart data ─── */
  const velocityChartData = filtered.map((s) => ({
    name: s.projectKey,
    velocity: s.velocity,
    fill: s.projectColor,
  }));

  const statusPieData = [
    { name: "Done", value: totals.done },
    { name: "In Progress", value: totals.inProgress },
    { name: "To Do", value: Math.max(0, totals.total - totals.done - totals.inProgress) },
  ].filter((d) => d.value > 0);

  /* ─── Skeleton ─── */
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-56 skeleton rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  /* ─── No projects ─── */
  if (projects.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-24 border border-dashed border-border rounded-2xl">
          <BarChart3 className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h2 className="text-lg font-bold mb-2">No projects yet</h2>
          <p className="text-sm text-muted-foreground mb-6">Create a project to start seeing analytics</p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all"
          >
            <FolderKanban className="w-4 h-4" /> Create Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedProject === "all" ? "Overview across all projects" : `Viewing: ${stats.find((s) => s.projectId === selectedProject)?.projectName}`}
          </p>
        </div>

        {/* Project filter */}
        <div className="flex items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Projects</option>
            {stats.map((s) => (
              <option key={s.projectId} value={s.projectId}>{s.projectName}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: totals.total, icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Completed", value: totals.done, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "In Progress", value: totals.inProgress, icon: Zap, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Completion Rate", value: `${completionRate}%`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-foreground">{card.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity per project */}
        {velocityChartData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl border border-border bg-card">
            <h2 className="font-bold text-foreground mb-1">Sprint Velocity by Project</h2>
            <p className="text-xs text-muted-foreground mb-4">Tasks completed in the most recent sprint</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={velocityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="velocity" name="Velocity" radius={[6, 6, 0, 0]}>
                  {velocityChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Status distribution pie */}
        {statusPieData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="p-5 rounded-2xl border border-border bg-card">
            <h2 className="font-bold text-foreground mb-1">Overall Task Status</h2>
            <p className="text-xs text-muted-foreground mb-4">Distribution across {selectedProject === "all" ? "all projects" : "this project"}</p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {statusPieData.map((_, i) => (
                      <Cell key={i} fill={["#22c55e", "#6366f1", "#94a3b8"][i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5">
                {statusPieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ["#22c55e", "#6366f1", "#94a3b8"][i] }} />
                    <span className="text-foreground">{item.name}</span>
                    <span className="ml-auto font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-border">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {completionRate}% complete
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Project breakdown table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-foreground">Project Breakdown</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} project{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((s, i) => {
            const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
            return (
              <motion.div key={s.projectId}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="px-5 py-3.5 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Project badge */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: s.projectColor }}>
                    {s.projectKey.charAt(0)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.projectName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Users2 className="w-3 h-3" /> {s.members}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.avgCycleTime}d avg</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="hidden sm:flex flex-col gap-1 w-28">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: s.projectColor }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">{s.done}/{s.total} done</p>
                  </div>

                  {/* Go to project analytics */}
                  <Link
                    href={`/dashboard/projects/${s.projectId}/analytics`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0"
                  >
                    Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
