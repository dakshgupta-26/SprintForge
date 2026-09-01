import { DependencyGraph } from './graph';
import { CPMAnalysisResult } from './cpm';
import {
  RiskEvaluation,
  RiskLevel,
  RiskFactor,
  WorkloadProfile,
  SprintHealthMetrics,
} from './types';

export class RiskEngine {
  /**
   * Computes team workload and capacity utilization.
   * Standard 2-week sprint capacity: 80 working hours (40h/week).
   */
  public static computeWorkload(
    graph: DependencyGraph,
    sprintDurationDays: number = 10
  ): Map<string, WorkloadProfile> {
    const workloadMap = new Map<string, WorkloadProfile>();
    const engineerCapacityHours = Math.max(20, sprintDurationDays * 8);

    for (const node of graph.nodes.values()) {
      if (node.status === 'done') continue;

      for (const assignee of node.assignees) {
        if (!assignee._id) continue;

        if (!workloadMap.has(assignee._id)) {
          workloadMap.set(assignee._id, {
            userId: assignee._id,
            name: assignee.name,
            avatar: assignee.avatar,
            email: assignee.email,
            totalEstimatedHours: 0,
            capacityHours: engineerCapacityHours,
            utilizationRatio: 0,
            isOverloaded: false,
            assignedTasks: [],
          });
        }

        const profile = workloadMap.get(assignee._id)!;
        // Divide hours across co-assignees if multiple
        const perAssigneeHours = node.estimatedHours / Math.max(1, node.assignees.length);
        profile.totalEstimatedHours += perAssigneeHours;
        profile.assignedTasks.push(node._id);
      }
    }

    for (const profile of workloadMap.values()) {
      profile.totalEstimatedHours = Math.round(profile.totalEstimatedHours * 10) / 10;
      profile.utilizationRatio =
        Math.round((profile.totalEstimatedHours / profile.capacityHours) * 100) / 100;
      profile.isOverloaded = profile.utilizationRatio > 1.0;
    }

    return workloadMap;
  }

  /**
   * Evaluates deterministic multi-factor risk score (0 to 100) for a single task.
   */
  public static evaluateTaskRisk(
    taskId: string,
    graph: DependencyGraph,
    cpm: CPMAnalysisResult,
    workload: Map<string, WorkloadProfile>,
    sprintEndDate?: Date
  ): RiskEvaluation {
    const node = graph.nodes.get(taskId);
    if (!node) {
      return {
        taskId,
        score: 0,
        level: 'low',
        isCriticalPath: false,
        factors: [],
        reasons: ['Task not found in dependency graph'],
      };
    }

    // Done tasks have zero risk
    if (node.status === 'done') {
      return {
        taskId,
        score: 0,
        level: 'low',
        isCriticalPath: false,
        factors: [{ name: 'Status', score: 0, maxScore: 100, description: 'Task is completed' }],
        reasons: ['Task is completed'],
      };
    }

    const cpmMetrics = cpm.metrics.get(taskId);
    const blast = graph.getDownstreamBlastRadius(taskId);
    const factors: RiskFactor[] = [];
    const reasons: string[] = [];

    // 1. Critical Path Factor (Max 30 pts)
    const isCritical = Boolean(cpmMetrics?.isCritical);
    const cpScore = isCritical ? 30 : 0;
    factors.push({
      name: 'Critical Path',
      score: cpScore,
      maxScore: 30,
      description: isCritical
        ? 'Zero float schedule bottleneck (any delay directly shifts project deadline)'
        : 'Non-critical path task with available float buffer',
    });
    if (isCritical) {
      reasons.push('Task is on the critical path with zero schedule buffer');
    }

    // 2. Downstream Propagation Depth Factor (Max 20 pts)
    const depthScore = Math.min(20, Math.round(blast.downstreamDepth * 6.5));
    factors.push({
      name: 'Propagation Depth',
      score: depthScore,
      maxScore: 20,
      description: `Maximum dependency depth of ${blast.downstreamDepth} levels downstream`,
    });
    if (blast.downstreamDepth >= 2) {
      reasons.push(`Deep propagation chain of ${blast.downstreamDepth} downstream levels`);
    }

    // 3. Downstream Dependent Tasks Count (Max 20 pts)
    const downCount = blast.downstreamTaskIds.length;
    const downScore = Math.min(20, downCount * 4);
    factors.push({
      name: 'Downstream Blast Radius',
      score: downScore,
      maxScore: 20,
      description: `Blocks ${downCount} downstream tasks across ${blast.affectedEngineers.length} engineers`,
    });
    if (downCount > 0) {
      reasons.push(`Directly or transitively blocks ${downCount} other tasks`);
    }

    // 4. Assignee Capacity & Overload Pressure (Max 15 pts)
    let maxAssigneeUtil = 0;
    let overloadedAssigneeName = '';

    for (const assignee of node.assignees) {
      const profile = workload.get(assignee._id);
      if (profile && profile.utilizationRatio > maxAssigneeUtil) {
        maxAssigneeUtil = profile.utilizationRatio;
        overloadedAssigneeName = profile.name;
      }
    }

    let workloadScore = 0;
    if (maxAssigneeUtil > 1.15) {
      workloadScore = 15;
    } else if (maxAssigneeUtil > 0.85) {
      workloadScore = 10;
    } else if (maxAssigneeUtil > 0.70) {
      workloadScore = 5;
    }

    factors.push({
      name: 'Assignee Workload',
      score: workloadScore,
      maxScore: 15,
      description: `Assignee peak sprint workload at ${Math.round(maxAssigneeUtil * 100)}% capacity`,
    });
    if (maxAssigneeUtil > 1.0) {
      reasons.push(`Assignee ${overloadedAssigneeName} is overloaded (${Math.round(maxAssigneeUtil * 100)}% capacity)`);
    }

    // 5. Due Date / Deadline Proximity (Max 15 pts)
    let dueScore = 0;
    const now = new Date();

    if (node.dueDate) {
      const dueDate = new Date(node.dueDate);
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntilDue < 0) {
        dueScore = 15;
        reasons.push(`Task is overdue by ${Math.abs(Math.round(daysUntilDue))} days`);
      } else if (daysUntilDue <= 2) {
        dueScore = 10;
        reasons.push(`Due date is imminent (${Math.round(daysUntilDue * 10) / 10} days remaining)`);
      } else if (daysUntilDue <= 4) {
        dueScore = 5;
      }
    } else if (sprintEndDate) {
      const daysUntilSprintEnd = (new Date(sprintEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntilSprintEnd < cpmMetrics?.durationDays! * 1.5) {
        dueScore = 8;
        reasons.push('Remaining sprint window is tight relative to task estimate');
      }
    }

    factors.push({
      name: 'Schedule Pressure',
      score: dueScore,
      maxScore: 15,
      description: 'Timeline proximity and deadline pressure',
    });

    // 6. Blocked Dependency State (Max 15 pts)
    let blockerScore = 0;
    if (node.isBlocked || node.status === 'blocked') {
      blockerScore = 15;
      reasons.push('Task is actively flagged as blocked');
    } else {
      // Check if any predecessor is overdue or blocked
      for (const predId of node.predecessorIds) {
        const predNode = graph.nodes.get(predId);
        if (predNode && (predNode.status === 'blocked' || predNode.isBlocked)) {
          blockerScore = 12;
          reasons.push(`Upstream dependency "${predNode.title}" is blocked`);
          break;
        }
      }
    }

    if (blockerScore > 0) {
      factors.push({
        name: 'Blocker Status',
        score: blockerScore,
        maxScore: 15,
        description: 'Upstream blockers or actively blocked flag',
      });
    }

    // Total Normalized Score (0 to 100)
    const rawTotal = factors.reduce((sum, f) => sum + f.score, 0);
    const score = Math.min(100, Math.max(0, rawTotal));

    let level: RiskLevel = 'low';
    if (score >= 75) level = 'critical';
    else if (score >= 50) level = 'high';
    else if (score >= 25) level = 'moderate';
    else level = 'low';

    if (reasons.length === 0) {
      reasons.push('Task has healthy float buffer and no active blockers');
    }

    return {
      taskId,
      score,
      level,
      isCriticalPath: isCritical,
      factors,
      reasons,
    };
  }

  /**
   * Computes high-level Sprint Health Metrics.
   */
  public static computeSprintHealth(
    graph: DependencyGraph,
    cpm: CPMAnalysisResult,
    riskEvaluations: Map<string, RiskEvaluation>,
    sprintEndDate?: Date
  ): SprintHealthMetrics {
    const totalTasks = graph.nodes.size;
    if (totalTasks === 0) {
      return {
        healthScore: 100,
        completionProbability: 100,
        totalTasks: 0,
        criticalTasksCount: 0,
        blockedTasksCount: 0,
        atRiskTasksCount: 0,
        projectedCompletionDate: new Date().toISOString(),
        projectedDelayDays: 0,
      };
    }

    let criticalCount = 0;
    let blockedCount = 0;
    let atRiskCount = 0;
    let totalRiskSum = 0;

    for (const [taskId, node] of graph.nodes.entries()) {
      const risk = riskEvaluations.get(taskId);
      if (!risk) continue;

      if (risk.isCriticalPath) criticalCount++;
      if (node.isBlocked || node.status === 'blocked') blockedCount++;
      if (risk.score >= 50) atRiskCount++;
      totalRiskSum += risk.score;
    }

    const avgRisk = totalRiskSum / totalTasks;
    const delayPenalty = Math.min(40, cpm.projectedDelayDays * 12);
    const blockedPenalty = Math.min(25, blockedCount * 8);

    const rawHealth = 100 - (avgRisk * 0.45) - delayPenalty - blockedPenalty;
    const healthScore = Math.max(5, Math.min(100, Math.round(rawHealth)));

    // Completion Probability Model
    const completionProbability = Math.max(
      10,
      Math.min(99, Math.round(100 - (cpm.projectedDelayDays * 15) - (atRiskCount * 4)))
    );

    return {
      healthScore,
      completionProbability,
      totalTasks,
      criticalTasksCount: criticalCount,
      blockedTasksCount: blockedCount,
      atRiskTasksCount: atRiskCount,
      baselineEndDate: sprintEndDate ? new Date(sprintEndDate).toISOString() : undefined,
      projectedCompletionDate: cpm.projectedCompletionDate.toISOString(),
      projectedDelayDays: cpm.projectedDelayDays,
    };
  }
}
