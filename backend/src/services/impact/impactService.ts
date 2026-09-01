import Project from '../../models/Project';
import Task from '../../models/Task';
import Sprint from '../../models/Sprint';
import { DependencyGraph } from './graph';
import { CPMEngine } from './cpm';
import { RiskEngine } from './riskEngine';
import { RecommendationEngine } from './recommendationEngine';
import { SimulatorEngine } from './simulator';
import {
  ImpactAnalysisResponse,
  SimulationChangePayload,
  SimulationResult,
  TaskAssignee,
} from './types';

export class ImpactService {
  /**
   * Retrieves complete, dependency-aware Impact Analysis for a project or sprint.
   */
  public static async getProjectImpact(
    projectId: string,
    sprintId?: string
  ): Promise<ImpactAnalysisResponse> {
    const project = await Project.findById(projectId).select('name key members owner').lean();
    if (!project) {
      throw new Error('Project not found');
    }

    // Determine target sprint if specified or look for currently active sprint
    let activeSprint: any = null;
    if (sprintId) {
      activeSprint = await Sprint.findById(sprintId).lean();
    } else {
      activeSprint = await Sprint.findOne({ project: projectId, status: 'active' }).lean();
    }

    // Query tasks
    const query: any = { project: projectId };
    if (activeSprint) {
      query.sprint = activeSprint._id;
    }

    const tasks = await Task.find(query)
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('dependencies', 'title status priority')
      .populate('blockedBy', 'title status priority')
      .lean();

    // 1. Build Dependency Graph
    const graph = DependencyGraph.fromTasks(tasks);

    // 2. Cycle Detection
    const { hasCycle, cyclePath } = graph.detectCycle();

    // 3. Critical Path Method (CPM)
    const cpm = CPMEngine.calculate(
      graph,
      activeSprint?.startDate,
      activeSprint?.endDate
    );

    // 4. Workload Analysis
    const sprintDays = activeSprint?.startDate && activeSprint?.endDate
      ? Math.max(5, Math.round((new Date(activeSprint.endDate).getTime() - new Date(activeSprint.startDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 10;
    const workloadMap = RiskEngine.computeWorkload(graph, sprintDays);

    // 5. Multi-factor Risk Scoring per Task
    const riskMap = new Map();
    for (const id of graph.nodes.keys()) {
      riskMap.set(
        id,
        RiskEngine.evaluateTaskRisk(id, graph, cpm, workloadMap, activeSprint?.endDate)
      );
    }

    // 6. Sprint Health Summary
    const health = RiskEngine.computeSprintHealth(
      graph,
      cpm,
      riskMap,
      activeSprint?.endDate
    );

    // 7. Top Ranked Risks
    const topRisks = Array.from(graph.nodes.keys())
      .map((id) => {
        const node = graph.nodes.get(id)!;
        const risk = riskMap.get(id)!;
        const blast = graph.getDownstreamBlastRadius(id);
        return {
          taskId: id,
          title: node.title,
          risk,
          downstreamCount: blast.downstreamTaskIds.length,
        };
      })
      .filter((item) => item.risk.score > 0)
      .sort((a, b) => b.risk.score - a.risk.score)
      .slice(0, 10);

    // 8. Explainable Recommendations
    const recommendations = RecommendationEngine.generate(
      graph,
      cpm,
      riskMap,
      workloadMap,
      activeSprint?.endDate
    );

    // 9. Format Task Nodes with Rich Analytics
    const enrichedTasks = Array.from(graph.nodes.values()).map((node) => {
      const nodeCPM = cpm.metrics.get(node._id)!;
      const nodeRisk = riskMap.get(node._id)!;
      const blast = graph.getDownstreamBlastRadius(node._id);

      return {
        _id: node._id,
        title: node.title,
        type: node.type,
        status: node.status,
        priority: node.priority,
        storyPoints: node.storyPoints,
        estimatedHours: node.estimatedHours,
        assignees: node.assignees,
        dueDate: node.dueDate,
        cpm: nodeCPM,
        risk: nodeRisk,
        blastRadius: {
          downstreamCount: blast.downstreamTaskIds.length,
          downstreamDepth: blast.downstreamDepth,
          affectedEngineersCount: blast.affectedEngineers.length,
        },
      };
    });

    return {
      projectId,
      sprintId: activeSprint ? String(activeSprint._id) : undefined,
      sprintName: activeSprint?.name,
      health,
      criticalPath: cpm.criticalPath,
      hasCycle,
      cycleNodes: cyclePath,
      tasks: enrichedTasks,
      edges: graph.edges,
      workload: Array.from(workloadMap.values()),
      topRisks,
      recommendations,
    };
  }

  /**
   * Executes in-memory What-If Simulation for a scenario.
   */
  public static async simulateChange(
    projectId: string,
    scenario: SimulationChangePayload,
    sprintId?: string
  ): Promise<SimulationResult> {
    const project = await Project.findById(projectId)
      .populate('members.user', 'name email avatar')
      .lean();

    if (!project) {
      throw new Error('Project not found');
    }

    const projectMembers: TaskAssignee[] = (project.members || []).map((m: any) => {
      const u = m.user || {};
      return {
        _id: String(u._id || m.user || m),
        name: u.name || 'Team Member',
        avatar: u.avatar || '',
        email: u.email || '',
      };
    });

    let activeSprint: any = null;
    if (sprintId) {
      activeSprint = await Sprint.findById(sprintId).lean();
    } else {
      activeSprint = await Sprint.findOne({ project: projectId, status: 'active' }).lean();
    }

    const query: any = { project: projectId };
    if (activeSprint) {
      query.sprint = activeSprint._id;
    }

    const tasks = await Task.find(query)
      .populate('assignees', 'name email avatar')
      .populate('dependencies', 'title status priority')
      .populate('blockedBy', 'title status priority')
      .lean();

    const baseGraph = DependencyGraph.fromTasks(tasks);

    return SimulatorEngine.simulate(
      baseGraph,
      scenario,
      activeSprint?.startDate,
      activeSprint?.endDate,
      projectMembers
    );
  }

  /**
   * Retrieves single-task impact overview (blast radius and upstream blockers).
   */
  public static async getTaskImpact(taskId: string) {
    const task = await Task.findById(taskId).lean();
    if (!task) throw new Error('Task not found');

    const projectTasks = await Task.find({ project: task.project })
      .populate('assignees', 'name email avatar')
      .populate('dependencies', 'title status priority')
      .lean();

    const graph = DependencyGraph.fromTasks(projectTasks);
    const cpm = CPMEngine.calculate(graph);
    const workload = RiskEngine.computeWorkload(graph);
    const risk = RiskEngine.evaluateTaskRisk(taskId, graph, cpm, workload);
    const blast = graph.getDownstreamBlastRadius(taskId);

    return {
      taskId,
      title: task.title,
      risk,
      cpm: cpm.metrics.get(taskId),
      downstreamCount: blast.downstreamTaskIds.length,
      downstreamDepth: blast.downstreamDepth,
      affectedEngineers: blast.affectedEngineers,
      upstreamCount: blast.upstreamTaskIds.length,
      isCriticalPath: Boolean(cpm.metrics.get(taskId)?.isCritical),
    };
  }
}
