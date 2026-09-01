import { DependencyGraph } from './graph';
import { CPMAnalysisResult } from './cpm';
import {
  RiskEvaluation,
  WorkloadProfile,
  Recommendation,
} from './types';

export class RecommendationEngine {
  /**
   * Generates actionable, deterministic recommendations to mitigate sprint bottlenecks.
   */
  public static generate(
    graph: DependencyGraph,
    cpm: CPMAnalysisResult,
    riskEvaluations: Map<string, RiskEvaluation>,
    workload: Map<string, WorkloadProfile>,
    sprintEndDate?: Date
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const workloadList = Array.from(workload.values());

    // Sort team members by available capacity (ascending utilization)
    const availableEngineers = [...workloadList].sort(
      (a, b) => a.utilizationRatio - b.utilizationRatio
    );

    // 1. REASSIGNMENT RECOMMENDATIONS for Overloaded Critical Path Tasks
    for (const taskId of cpm.criticalPath) {
      const node = graph.nodes.get(taskId);
      const risk = riskEvaluations.get(taskId);
      if (!node || !risk || node.status === 'done') continue;

      const currentAssignee = node.assignees[0];
      if (!currentAssignee) continue;

      const currentProfile = workload.get(currentAssignee._id);
      if (currentProfile && currentProfile.isOverloaded) {
        // Find best alternate candidate with lowest workload
        const candidate = availableEngineers.find(
          (eng) => eng.userId !== currentAssignee._id && eng.utilizationRatio < 0.75
        );

        if (candidate) {
          const availableHours = Math.max(0, candidate.capacityHours - candidate.totalEstimatedHours);
          recommendations.push({
            id: `rec-reassign-${taskId}-${candidate.userId}`,
            type: 'reassign',
            title: `Reassign "${node.title}" to ${candidate.name}`,
            description: `Transfer task ownership to balance sprint workload and relieve the critical path bottleneck.`,
            reason: `${candidate.name} has ${availableHours}h of available capacity (${Math.round(candidate.utilizationRatio * 100)}% utilized), whereas ${currentProfile.name} is currently overloaded at ${Math.round(currentProfile.utilizationRatio * 100)}% capacity.`,
            targetTaskId: taskId,
            targetTaskTitle: node.title,
            currentValue: { userId: currentAssignee._id, name: currentAssignee.name },
            suggestedValue: { userId: candidate.userId, name: candidate.name, avatar: candidate.avatar },
            projectedHealthDelta: 12,
            projectedDelayReductionDays: Math.min(1.5, Math.round((node.estimatedHours / 8) * 10) / 10),
          });
        }
      }
    }

    // 2. UNBLOCKING RECOMMENDATIONS for Blocked Critical Dependencies
    for (const [taskId, node] of graph.nodes.entries()) {
      if (node.status === 'done') continue;
      const risk = riskEvaluations.get(taskId);

      if (node.isBlocked || node.status === 'blocked') {
        const blast = graph.getDownstreamBlastRadius(taskId);
        recommendations.push({
          id: `rec-unblock-${taskId}`,
          type: 'unblock',
          title: `Resolve blocker on "${node.title}"`,
          description: `Prioritize unblocking this item to prevent propagation delay across ${blast.downstreamTaskIds.length} downstream tasks.`,
          reason: `This task is actively blocking ${blast.downstreamTaskIds.length} downstream items affecting ${blast.affectedEngineers.length} team members.`,
          targetTaskId: taskId,
          targetTaskTitle: node.title,
          projectedHealthDelta: 15,
          projectedDelayReductionDays: 1.0,
        });
      }
    }

    // 3. SCOPE SPLIT / DE-SCOPING for Sprint Schedule Recovery
    if (cpm.projectedDelayDays > 0) {
      // Find non-critical tasks with high effort and 0 downstream dependencies
      const nonCriticalLeafTasks = Array.from(graph.nodes.values())
        .filter((node) => {
          if (node.status === 'done') return false;
          const cpmMetrics = cpm.metrics.get(node._id);
          const blast = graph.getDownstreamBlastRadius(node._id);
          return !cpmMetrics?.isCritical && blast.downstreamTaskIds.length === 0 && node.estimatedHours >= 6;
        })
        .sort((a, b) => b.estimatedHours - a.estimatedHours);

      if (nonCriticalLeafTasks.length > 0) {
        const target = nonCriticalLeafTasks[0];
        const daysSaved = Math.round((target.estimatedHours / 6) * 10) / 10;

        recommendations.push({
          id: `rec-scope-${target._id}`,
          type: 'split_scope',
          title: `Defer "${target.title}" to Next Sprint`,
          description: `Move this standalone non-critical task out of the current sprint backlog to recover schedule buffer.`,
          reason: `"${target.title}" has 0 downstream dependencies. Deferring it reclaims ${target.estimatedHours}h of engineering effort and recovers ~${daysSaved} days of sprint buffer.`,
          targetTaskId: target._id,
          targetTaskTitle: target.title,
          projectedHealthDelta: 18,
          projectedDelayReductionDays: daysSaved,
        });
      }
    }

    return recommendations.slice(0, 5);
  }
}
