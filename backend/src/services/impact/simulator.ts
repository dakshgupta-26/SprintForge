import { DependencyGraph } from './graph';
import { CPMEngine } from './cpm';
import { RiskEngine } from './riskEngine';
import { RecommendationEngine } from './recommendationEngine';
import {
  SimulationChangePayload,
  SimulationResult,
  TaskAssignee,
} from './types';

export class SimulatorEngine {
  /**
   * Executes in-memory what-if scenario simulation without mutating any database records.
   */
  public static simulate(
    baseGraph: DependencyGraph,
    scenario: SimulationChangePayload,
    sprintStartDate?: Date,
    sprintEndDate?: Date,
    projectMembers: TaskAssignee[] = []
  ): SimulationResult {
    const { taskId } = scenario;
    const originalNode = baseGraph.nodes.get(taskId);
    const taskTitle = originalNode?.title || 'Selected Task';

    // 1. BASELINE CALCULATIONS
    const baseCPM = CPMEngine.calculate(baseGraph, sprintStartDate, sprintEndDate);
    const baseWorkload = RiskEngine.computeWorkload(baseGraph);
    const baseRiskMap = new Map();
    for (const id of baseGraph.nodes.keys()) {
      baseRiskMap.set(id, RiskEngine.evaluateTaskRisk(id, baseGraph, baseCPM, baseWorkload, sprintEndDate));
    }
    const baselineHealth = RiskEngine.computeSprintHealth(baseGraph, baseCPM, baseRiskMap, sprintEndDate);

    // 2. CLONE GRAPH & APPLY SCENARIO DELTA IN-MEMORY
    const simGraph = baseGraph.clone();
    const simNode = simGraph.nodes.get(taskId);

    if (simNode) {
      if (typeof scenario.estimatedHours === 'number' && scenario.estimatedHours >= 0) {
        simNode.estimatedHours = scenario.estimatedHours;
        simNode.storyPoints = Math.round((scenario.estimatedHours / 6) * 10) / 10;
      } else if (typeof scenario.storyPoints === 'number' && scenario.storyPoints >= 0) {
        simNode.storyPoints = scenario.storyPoints;
        simNode.estimatedHours = scenario.storyPoints * 6;
      }

      if (scenario.assigneeId) {
        const foundMember = projectMembers.find((m) => String(m._id) === String(scenario.assigneeId));
        if (foundMember) {
          simNode.assignees = [foundMember];
        }
      }

      if (scenario.status) {
        simNode.status = scenario.status;
        if (scenario.status === 'blocked') {
          simNode.isBlocked = true;
        } else if (scenario.status === 'done') {
          simNode.estimatedHours = 0;
          simNode.isBlocked = false;
        }
      }

      if (scenario.isBlocked !== undefined) {
        simNode.isBlocked = scenario.isBlocked;
        if (scenario.isBlocked) simNode.status = 'blocked';
      }

      if (scenario.dueDate) {
        simNode.dueDate = new Date(scenario.dueDate).toISOString();
      }

      // Add dependencies (add edge: pred -> taskId)
      if (Array.isArray(scenario.addDependencies)) {
        for (const predId of scenario.addDependencies) {
          simGraph.addEdge(predId, taskId, 'blocks');
        }
      }

      // Remove dependencies
      if (Array.isArray(scenario.removeDependencies)) {
        for (const predId of scenario.removeDependencies) {
          simGraph.adjList.get(predId)?.delete(taskId);
          simGraph.reverseAdjList.get(taskId)?.delete(predId);
          simGraph.edges = simGraph.edges.filter((e) => !(e.from === predId && e.to === taskId));
        }
      }
    }

    // 3. SIMULATED CALCULATIONS
    const simCPM = CPMEngine.calculate(simGraph, sprintStartDate, sprintEndDate);
    const simWorkload = RiskEngine.computeWorkload(simGraph);
    const simRiskMap = new Map();
    for (const id of simGraph.nodes.keys()) {
      simRiskMap.set(id, RiskEngine.evaluateTaskRisk(id, simGraph, simCPM, simWorkload, sprintEndDate));
    }
    const simulatedHealth = RiskEngine.computeSprintHealth(simGraph, simCPM, simRiskMap, sprintEndDate);

    // 4. BLAST RADIUS & AFFECTED DOWNSTREAM ITEMS
    const blast = simGraph.getDownstreamBlastRadius(taskId);
    const delayDeltaDays = Math.round((simCPM.projectedDelayDays - baseCPM.projectedDelayDays) * 10) / 10;
    const healthDelta = simulatedHealth.healthScore - baselineHealth.healthScore;

    const affectedTasks = blast.downstreamTaskIds.map((downId) => {
      const node = simGraph.nodes.get(downId)!;
      const baseNodeCPM = baseCPM.metrics.get(downId);
      const simNodeCPM = simCPM.metrics.get(downId);
      const shiftDays = (simNodeCPM?.earliestStart || 0) - (baseNodeCPM?.earliestStart || 0);

      return {
        _id: downId,
        title: node.title,
        status: node.status,
        priority: node.priority,
        assignees: node.assignees,
        delayImpactDays: Math.max(0, Math.round(shiftDays * 10) / 10),
      };
    });

    const newBlockersCreated: Array<{ taskId: string; title: string }> = [];
    if (simNode?.isBlocked && !originalNode?.isBlocked) {
      newBlockersCreated.push({ taskId, title: taskTitle });
    }

    const recommendations = RecommendationEngine.generate(
      simGraph,
      simCPM,
      simRiskMap,
      simWorkload,
      sprintEndDate
    );

    return {
      scenarioTaskId: taskId,
      scenarioTaskTitle: taskTitle,
      baselineHealth,
      simulatedHealth,
      healthDelta,
      projectedDelayDeltaDays: delayDeltaDays,
      affectedTasks,
      affectedEngineers: blast.affectedEngineers,
      newCriticalPath: simCPM.criticalPath,
      newBlockersCreated,
      recommendations,
    };
  }
}
