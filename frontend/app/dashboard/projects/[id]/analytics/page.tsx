"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { analyticsAPI, sprintAPI } from "@/lib/api";
import { useProjectStore } from "@/lib/store/projectStore";
import { useAuthStore } from "@/lib/store/authStore";
import { getSocket } from "@/lib/socket";
import { motion } from "framer-motion";
import {
  BarChart3,
  Zap,
  Clock,
  TrendingUp,
  Users2,
  Activity,
  Layers,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProjectHealthScore } from "@/components/analytics/ProjectHealthScore";
import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { SprintBurndownChart } from "@/components/analytics/SprintBurndownChart";
import { VelocityTrendChart } from "@/components/analytics/VelocityTrendChart";
import { WorkDistributionCard } from "@/components/analytics/WorkDistributionCard";
import { TeamCapacityCard } from "@/components/analytics/TeamCapacityCard";
import { AgingAndBlockedCard } from "@/components/analytics/AgingAndBlockedCard";
import { SprintIntelligenceCard } from "@/components/analytics/SprintIntelligenceCard";

export default function AnalyticsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentProject, fetchProject } = useProjectStore();
  const { user: currentUser } = useAuthStore();

  const [analytics, setAnalytics] = useState<any>(null);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [burndown, setBurndown] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    fetchProject(projectId);
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, teamRes, sprintsRes] = await Promise.all([
        analyticsAPI.getProject(projectId),
        analyticsAPI.getTeam(projectId),
        sprintAPI.getAll(projectId),
      ]);

      setAnalytics(analyticsRes.data);
      setTeamData(teamRes.data || []);

      const allSprints: any[] = sprintsRes.data || [];
      setSprints(allSprints);

      const active = allSprints.find((s: any) => s.status === "active");
      const target = active || allSprints[0];
      if (target) {
        setSelectedSprintId(target._id);
        try {
          const burnRes = await sprintAPI.getBurndown(target._id);
          setBurndown(burnRes.data);
        } catch {
          setBurndown(null);
        }
      }
    } catch {
      toast.error("Failed to load project analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSprint = async (sprintId: string) => {
    setSelectedSprintId(sprintId);
    try {
      const burnRes = await sprintAPI.getBurndown(sprintId);
      setBurndown(burnRes.data);
    } catch {
      setBurndown(null);
    }
  };

  // ── Real-Time Socket.IO Synchronization ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !projectId) return;

    socket.emit("join:project", { projectId, userId: currentUser?._id });

    const handleDataChanged = () => {
      // Re-fetch analytics seamlessly in background
      Promise.all([
        analyticsAPI.getProject(projectId),
        analyticsAPI.getTeam(projectId),
      ]).then(([analyticsRes, teamRes]) => {
        setAnalytics(analyticsRes.data);
        setTeamData(teamRes.data || []);
      });
    };

    socket.on("task:created", handleDataChanged);
    socket.on("task:moved", handleDataChanged);
    socket.on("task:updated", handleDataChanged);
    socket.on("task:deleted", handleDataChanged);

    return () => {
      socket.off("task:created", handleDataChanged);
      socket.off("task:moved", handleDataChanged);
      socket.off("task:updated", handleDataChanged);
      socket.off("task:deleted", handleDataChanged);
    };
  }, [projectId, currentUser?._id]);

  const selectedSprint = sprints.find((s) => s._id === selectedSprintId) || sprints[0];
  const velocityData = analytics?.velocity || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* ── 1. PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Activity className="w-3 h-3" /> Telemetry & Intelligence
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">
              {currentProject?.name || "TASKDEV"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Engineering Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Understand delivery performance, team throughput, cycle times, and sprint health.
          </p>
        </div>

        {/* Global Filters */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {sprints.length > 0 && (
            <select
              value={selectedSprintId}
              onChange={(e) => handleSelectSprint(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              {sprints.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          )}

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-[#060914] border border-white/[0.08] text-xs font-semibold text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="14d">Last 14 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        /* ── Realistic Loading Skeletons ── */
        <div className="space-y-6">
          <div className="h-32 bg-white/[0.02] border border-white/[0.04] rounded-3xl animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-28 bg-white/[0.02] border border-white/[0.04] rounded-3xl animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-white/[0.02] border border-white/[0.04] rounded-3xl animate-pulse" />
            <div className="h-80 bg-white/[0.02] border border-white/[0.04] rounded-3xl animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          {/* ── 2. TOP LEVEL HEALTH SUMMARY ── */}
          <ProjectHealthScore
            completionRate={analytics?.completionRate || 0}
            velocityData={velocityData}
            inProgressCount={analytics?.inProgressCount || 0}
            blockedCount={analytics?.blockedTasks?.length || 0}
            totalTasks={analytics?.totalTasks || 0}
          />

          {/* ── 3. PRIMARY KPI ROW ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Velocity */}
            <AnalyticsMetricCard
              label="Sprint Velocity"
              value={`${velocityData[velocityData.length - 1]?.completed || 0} SP`}
              trend={{
                value: "+12%",
                isPositive: true,
              }}
              icon={TrendingUp}
              color="text-indigo-400"
              bg="bg-indigo-500/10"
              description="Total completed story points delivered in the most recent sprint cycle."
            />

            {/* Cycle Time */}
            <AnalyticsMetricCard
              label="Avg Cycle Time"
              value={`${analytics?.avgCycleTime || 0}d`}
              trend={{
                value: "Steady",
                isNeutral: true,
              }}
              icon={Clock}
              color="text-blue-400"
              bg="bg-blue-500/10"
              description="Average duration from when a work item is created until it reaches Done."
            />

            {/* Median Lead Time */}
            <AnalyticsMetricCard
              label="Median Cycle"
              value={`${analytics?.medianCycleTime || 0}d`}
              subValue="P50"
              icon={Zap}
              color="text-cyan-400"
              bg="bg-cyan-500/10"
              description="The middle cycle time value, eliminating outliers from large refactors."
            />

            {/* Completion Rate */}
            <AnalyticsMetricCard
              label="Completion Rate"
              value={`${analytics?.completionRate || 0}%`}
              trend={{
                value: `${analytics?.doneTasksCount || 0}/${analytics?.totalTasks || 0}`,
                isPositive: (analytics?.completionRate || 0) >= 60,
              }}
              icon={CheckCircle2}
              color="text-emerald-400"
              bg="bg-emerald-500/10"
              description="Percentage of total project work items that have been resolved and closed."
            />

            {/* WIP (Work in Progress) */}
            <AnalyticsMetricCard
              label="Active WIP"
              value={`${analytics?.inProgressCount || 0}`}
              subValue="tasks"
              trend={{
                value: (analytics?.inProgressCount || 0) > 8 ? "High" : "Optimal",
                isPositive: (analytics?.inProgressCount || 0) <= 8,
              }}
              icon={Layers}
              color="text-amber-400"
              bg="bg-amber-500/10"
              description="Concurrent items currently being actively implemented or peer reviewed."
            />

            {/* Critical Blockers */}
            <AnalyticsMetricCard
              label="Blockers (P0)"
              value={`${analytics?.blockedTasks?.length || 0}`}
              trend={{
                value: (analytics?.blockedTasks?.length || 0) > 0 ? "Action" : "Clear",
                isPositive: (analytics?.blockedTasks?.length || 0) === 0,
              }}
              icon={AlertTriangle}
              color="text-rose-400"
              bg="bg-rose-500/10"
              description="Critical severity issues that require immediate engineering unblocking."
            />
          </div>

          {/* ── 4. MAJOR CHARTS ROW (Burndown & Velocity) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SprintBurndownChart
              sprint={selectedSprint}
              burndownData={burndown}
              sprints={sprints}
              onSelectSprint={handleSelectSprint}
            />

            <VelocityTrendChart velocityData={velocityData} />
          </div>

          {/* ── 5. WORK DISTRIBUTION & TEAM CAPACITY ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WorkDistributionCard
              typeDist={analytics?.typeDist || []}
              priorityDist={analytics?.priorityDist || []}
            />

            <TeamCapacityCard teamData={teamData} />
          </div>

          {/* ── 6. BLOCKERS & AGING WORK ── */}
          <AgingAndBlockedCard
            blockedTasks={analytics?.blockedTasks || []}
            agingTasks={analytics?.agingTasks || []}
            projectId={projectId}
          />

          {/* ── 7. SPRINTFORGE INTELLIGENCE ENGINE ── */}
          <SprintIntelligenceCard
            projectId={projectId}
            avgCycleTime={analytics?.avgCycleTime || 0}
            inProgressCount={analytics?.inProgressCount || 0}
            blockedCount={analytics?.blockedTasks?.length || 0}
            completionRate={analytics?.completionRate || 0}
            activeSprint={analytics?.activeSprint}
            velocityData={velocityData}
          />
        </>
      )}
    </div>
  );
}
