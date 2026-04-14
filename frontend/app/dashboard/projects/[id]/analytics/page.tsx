"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { analyticsAPI, sprintAPI } from "@/lib/api";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { BarChart3, Zap, Clock, TrendingUp, ArrowUpRight, Users2 } from "lucide-react";
import { useProjectStore } from "@/lib/store/projectStore";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#22c55e", "#f59e0b", "#ef4444"];

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, fetchProject } = useProjectStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [burndown, setBurndown] = useState<any>(null);
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [sprints, setSprints] = useState<any[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");

  useEffect(() => {
    fetchProject(id);
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, teamRes, sprintsRes] = await Promise.all([
        analyticsAPI.getProject(id),
        analyticsAPI.getTeam(id),
        sprintAPI.getAll(id),
      ]);
      setAnalytics(analyticsRes.data);
      setTeamData(teamRes.data);

      const allSprints: any[] = sprintsRes.data;
      setSprints(allSprints);

      // Default: prefer active sprint, fall back to most recent
      const active = allSprints.find((s: any) => s.status === "active");
      const target = active || allSprints[0];
      if (target) {
        setActiveSprint(target);
        setSelectedSprintId(target._id);
        const burnRes = await sprintAPI.getBurndown(target._id);
        setBurndown(burnRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBurndown = async (sprintId: string) => {
    try {
      const sprint = sprints.find((s) => s._id === sprintId);
      setActiveSprint(sprint);
      setSelectedSprintId(sprintId);
      const burnRes = await sprintAPI.getBurndown(sprintId);
      setBurndown(burnRes.data);
    } catch {
      setBurndown(null);
    }
  };


  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const statusData = analytics?.statusDist?.map((s: any) => ({
    name: s._id.replace("_", " "),
    value: s.count,
  })) || [];

  const priorityData = analytics?.priorityDist?.map((p: any) => ({
    name: p._id,
    count: p.count,
  })) || [];

  const velocityData = analytics?.velocity || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">{currentProject?.name} • Performance insights</p>
        </div>
        {/* Sprint selector */}
        {sprints.length > 0 && (
          <select value={selectedSprintId} onChange={(e) => loadBurndown(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
            {sprints.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        )}
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg Cycle Time", value: `${analytics?.avgCycleTime || 0}d`, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Total Sprints", value: velocityData.length, icon: Zap, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Sprint Velocity", value: velocityData[velocityData.length - 1]?.completed || 0, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Team Members", value: teamData.length, icon: Users2, color: "text-pink-500", bg: "bg-pink-500/10" },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl border border-border bg-card">
              <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black">{card.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown Chart */}
        {burndown && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl border border-border bg-card">
            <h2 className="font-bold mb-1">Burndown Chart</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Sprint: <span className={cn("font-medium", activeSprint?.status === "active" ? "text-green-500" : "")}>
                {activeSprint?.name}
              </span>
              {activeSprint?.status === "active" && " 🏃 Active"}
              {activeSprint?.status === "completed" && " ✓ Completed"}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={burndown.data}>
                <defs>
                  <linearGradient id="remaining" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Legend />
                <Area type="monotone" dataKey="remaining" name="Remaining" stroke="#6366f1" fill="url(#remaining)" strokeWidth={2} />
                <Line type="monotone" dataKey="ideal" name="Ideal" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}


        {/* Velocity Chart */}
        {velocityData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="p-5 rounded-2xl border border-border bg-card">
            <h2 className="font-bold mb-1">Sprint Velocity</h2>
            <p className="text-xs text-muted-foreground mb-4">Story points completed per sprint</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Legend />
                <Bar dataKey="planned" name="Planned" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Task status distribution */}
        {statusData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl border border-border bg-card">
            <h2 className="font-bold mb-4">Task Status Distribution</h2>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {statusData.map((_: any, index: number) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {statusData.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i] }} />
                    <span className="text-foreground capitalize">{item.name}</span>
                    <span className="ml-auto font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Priority breakdown */}
        {priorityData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="p-5 rounded-2xl border border-border bg-card">
            <h2 className="font-bold mb-4">Priority Breakdown</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={60} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="count" name="Tasks" radius={[0, 4, 4, 0]}>
                  {priorityData.map((_: any, index: number) => (
                    <Cell key={index} fill={["#3b82f6", "#f59e0b", "#f97316", "#ef4444"][index] || "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Team productivity */}
      {teamData.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl border border-border bg-card">
          <h2 className="font-bold mb-4">Team Productivity</h2>
          <div className="space-y-3">
            {teamData.map((member) => (
              <div key={member._id} className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {member.name?.charAt(0)}
                </div>
                <span className="text-sm text-foreground w-28 truncate">{member.name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${member.total > 0 ? (member.completed / member.total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-20 text-right">{member.completed}/{member.total} tasks</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!analytics && !burndown && (
        <div className="p-8 border border-dashed border-border rounded-2xl text-center space-y-4">
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
          <p className="font-semibold text-foreground">No analytics data yet</p>
          <p className="text-sm text-muted-foreground">Follow these steps to populate your charts:</p>
          <div className="inline-flex flex-col items-start gap-2 text-sm text-left mx-auto">
            {[
              "Create tasks with story points on the Board",
              "Go to Sprints → create a new sprint with start/end dates",
              "Add tasks to the sprint via the Backlog page",
              "Click Start Sprint on the Sprints page",
              "Move tasks to Done on the board",
              "Click Complete Sprint → velocity data is recorded",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
