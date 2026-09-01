export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface TaskAssignee {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
}

export interface CPMTaskMetrics {
  taskId: string;
  durationDays: number;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
}

export interface RiskFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface RiskEvaluation {
  taskId: string;
  score: number;
  level: RiskLevel;
  isCriticalPath: boolean;
  factors: RiskFactor[];
  reasons: string[];
}

export interface EnrichedTask {
  _id: string;
  title: string;
  type: string;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints?: number;
  estimatedHours: number;
  assignees: TaskAssignee[];
  dueDate?: string;
  cpm: CPMTaskMetrics;
  risk: RiskEvaluation;
  blastRadius: {
    downstreamCount: number;
    downstreamDepth: number;
    affectedEngineersCount: number;
  };
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'blocks' | 'parent' | 'subtask' | 'linked';
}

export interface WorkloadProfile {
  userId: string;
  name: string;
  avatar?: string;
  email?: string;
  totalEstimatedHours: number;
  capacityHours: number;
  utilizationRatio: number;
  isOverloaded: boolean;
  assignedTasks: string[];
}

export interface SprintHealthMetrics {
  healthScore: number;
  completionProbability: number;
  totalTasks: number;
  criticalTasksCount: number;
  blockedTasksCount: number;
  atRiskTasksCount: number;
  baselineEndDate?: string;
  projectedCompletionDate: string;
  projectedDelayDays: number;
  sprintRemainingDays?: number;
}

export interface Recommendation {
  id: string;
  type: 'reassign' | 'split_scope' | 'unblock' | 'reschedule';
  title: string;
  description: string;
  reason: string;
  targetTaskId: string;
  targetTaskTitle: string;
  currentValue?: any;
  suggestedValue?: any;
  projectedHealthDelta: number;
  projectedDelayReductionDays: number;
}

export interface ImpactAnalysisData {
  projectId: string;
  sprintId?: string;
  sprintName?: string;
  health: SprintHealthMetrics;
  criticalPath: string[];
  hasCycle: boolean;
  cycleNodes?: string[];
  tasks: EnrichedTask[];
  edges: DependencyEdge[];
  workload: WorkloadProfile[];
  topRisks: Array<{
    taskId: string;
    title: string;
    risk: RiskEvaluation;
    downstreamCount: number;
  }>;
  recommendations: Recommendation[];
}

export interface SimulationResult {
  scenarioTaskId: string;
  scenarioTaskTitle: string;
  baselineHealth: SprintHealthMetrics;
  simulatedHealth: SprintHealthMetrics;
  healthDelta: number;
  projectedDelayDeltaDays: number;
  affectedTasks: Array<{
    _id: string;
    title: string;
    status: string;
    priority: string;
    assignees: TaskAssignee[];
    delayImpactDays: number;
  }>;
  affectedEngineers: TaskAssignee[];
  newCriticalPath: string[];
  newBlockersCreated: Array<{ taskId: string; title: string }>;
  recommendations: Recommendation[];
}
