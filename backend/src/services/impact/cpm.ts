import { DependencyGraph } from './graph';
import { CPMTaskMetrics } from './types';

/**
 * Calculates working days added to a base Date, skipping Saturdays and Sundays.
 */
export function addWorkingDays(startDate: Date, daysToAdd: number): Date {
  const result = new Date(startDate);
  let wholeDays = Math.floor(daysToAdd);
  const partialDayMs = (daysToAdd - wholeDays) * 8 * 60 * 60 * 1000; // 8h workday

  while (wholeDays > 0) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      wholeDays--;
    }
  }

  result.setTime(result.getTime() + partialDayMs);
  return result;
}

export interface CPMAnalysisResult {
  metrics: Map<string, CPMTaskMetrics>;
  criticalPath: string[]; // Task IDs in chronological order along the critical chain
  totalProjectDurationDays: number;
  projectedCompletionDate: Date;
  projectedDelayDays: number;
}

/**
 * Critical Path Method (CPM) Engine
 * Performs Forward Pass (ES/EF) and Backward Pass (LS/LF) to determine Slack and Critical Path.
 */
export class CPMEngine {
  public static calculate(
    graph: DependencyGraph,
    sprintStartDate?: Date,
    sprintEndDate?: Date
  ): CPMAnalysisResult {
    const topoOrder = graph.getTopologicalSort();
    const metrics = new Map<string, CPMTaskMetrics>();
    const baseStart = sprintStartDate ? new Date(sprintStartDate) : new Date();

    // 1. FORWARD PASS: Calculate Earliest Start (ES) and Earliest Finish (EF)
    for (const taskId of topoOrder) {
      const node = graph.nodes.get(taskId);
      if (!node) continue;

      // Tasks marked 'done' have 0 remaining effort
      const durationDays = node.status === 'done' ? 0 : Math.max(0.5, Math.round((node.estimatedHours / 6) * 10) / 10);

      let earliestStart = 0;
      const predecessors = graph.reverseAdjList.get(taskId) || new Set();

      for (const predId of predecessors) {
        const predMetrics = metrics.get(predId);
        if (predMetrics) {
          earliestStart = Math.max(earliestStart, predMetrics.earliestFinish);
        }
      }

      const earliestFinish = earliestStart + durationDays;

      metrics.set(taskId, {
        taskId,
        durationDays,
        earliestStart,
        earliestFinish,
        latestStart: 0,
        latestFinish: 0,
        slack: 0,
        isCritical: false,
      });
    }

    // Maximum project duration required to complete all tasks
    let totalProjectDurationDays = 0;
    for (const m of metrics.values()) {
      if (m.earliestFinish > totalProjectDurationDays) {
        totalProjectDurationDays = m.earliestFinish;
      }
    }

    // 2. BACKWARD PASS: Calculate Latest Finish (LF) and Latest Start (LS)
    const reverseOrder = [...topoOrder].reverse();

    for (const taskId of reverseOrder) {
      const current = metrics.get(taskId);
      if (!current) continue;

      const successors = graph.adjList.get(taskId) || new Set();
      let latestFinish = totalProjectDurationDays;

      if (successors.size > 0) {
        latestFinish = Infinity;
        for (const succId of successors) {
          const succMetrics = metrics.get(succId);
          if (succMetrics) {
            latestFinish = Math.min(latestFinish, succMetrics.latestStart);
          }
        }
      }

      if (latestFinish === Infinity) latestFinish = totalProjectDurationDays;

      const latestStart = Math.max(0, latestFinish - current.durationDays);
      const slack = Math.max(0, Math.round((latestStart - current.earliestStart) * 10) / 10);
      const isCritical = slack <= 0.1 && current.durationDays > 0;

      current.latestFinish = latestFinish;
      current.latestStart = latestStart;
      current.slack = slack;
      current.isCritical = isCritical;
    }

    // 3. Extract Critical Path chain in chronological order
    const criticalTaskIds = Array.from(metrics.values())
      .filter((m) => m.isCritical)
      .sort((a, b) => a.earliestStart - b.earliestStart)
      .map((m) => m.taskId);

    // 4. Calculate Projected Completion Date and Schedule Delay
    const projectedCompletionDate = addWorkingDays(baseStart, totalProjectDurationDays);

    let projectedDelayDays = 0;
    if (sprintEndDate) {
      const targetEnd = new Date(sprintEndDate);
      const msDiff = projectedCompletionDate.getTime() - targetEnd.getTime();
      projectedDelayDays = Math.max(0, Math.round((msDiff / (1000 * 60 * 60 * 24)) * 10) / 10);
    }

    return {
      metrics,
      criticalPath: criticalTaskIds,
      totalProjectDurationDays: Math.round(totalProjectDurationDays * 10) / 10,
      projectedCompletionDate,
      projectedDelayDays,
    };
  }
}
