export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface TaskAssignee {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
}

export interface TaskNode {
  _id: string;
  title: string;
  type: string;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints?: number;
  estimatedHours: number;
  loggedHours?: number;
  assignees: TaskAssignee[];
  dueDate?: string;
  startDate?: string;
  sprintId?: string;
  predecessorIds: string[]; // Tasks that MUST finish before this task can start
  successorIds: string[];   // Tasks that depend on this task
  isBlocked?: boolean;
}

export interface DependencyEdge {
  from: string; // Predecessor (Task A)
  to: string;   // Successor (Task B)
  type: 'blocks' | 'parent' | 'subtask' | 'linked';
}

export interface CPMTaskMetrics {
  taskId: string;
  durationDays: number;
  earliestStart: number;  // In working days from project start
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;          // Float in days (LS - ES)
  isCritical: boolean;
}

export interface BlastRadius {
  downstreamTaskIds: string[];
  upstreamTaskIds: string[];
  downstreamDepth: number;
  affectedEngineers: TaskAssignee[];
  propagationDelayDays: number;
}

export interface RiskFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface RiskEvaluation {
  taskId: string;
  score: number;          // 0 to 100
  level: RiskLevel;
  isCriticalPath: boolean;
  factors: RiskFactor[];
  reasons: string[];      // Explainable bullet points
}

export interface WorkloadProfile {
  userId: string;
  name: string;
  avatar?: string;
  email?: string;
  totalEstimatedHours: number;
  capacityHours: number;
  utilizationRatio: number; // e.g. 1.15 = 115%
  isOverloaded: boolean;
  assignedTasks: string[];
}

export interface SprintHealthMetrics {
  healthScore: number;          // 0 to 100%
  completionProbability: number;// 0 to 100%
  totalTasks: number;
  criticalTasksCount: number;
  blockedTasksCount: number;
  atRiskTasksCount: number;
  baselineEndDate?: string;
  projectedCompletionDate: string;
  projectedDelayDays: number;
  sprintRemainingDays?: number;
  riskTrend?: Array<{ date: string; score: number }>;
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

export interface SimulationChangePayload {
  taskId: string;
  estimatedHours?: number;
  storyPoints?: number;
  assigneeId?: string;
  status?: TaskStatus;
  dueDate?: string;
  addDependencies?: string[];
  removeDependencies?: string[];
  isBlocked?: boolean;
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

export interface ImpactAnalysisResponse {
  projectId: string;
  sprintId?: string;
  sprintName?: string;
  health: SprintHealthMetrics;
  criticalPath: string[]; // List of task IDs in chronological order
  hasCycle: boolean;
  cycleNodes?: string[];
  tasks: Array<{
    _id: string;
    title: string;
    type: string;
    status: string;
    priority: string;
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
  }>;
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
