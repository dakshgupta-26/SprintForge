export type PriorityLevel = "critical" | "high" | "medium" | "low";
export type TaskStatus = "backlog" | "in_progress" | "in_review" | "done";

export interface TaskItem {
  id: string;
  key: string;
  title: string;
  tag: string;
  tagColor: string;
  priority: PriorityLevel;
  assignee: {
    name: string;
    avatar: string;
    color: string;
  };
  storyPoints: number;
  subtasks: { done: number; total: number };
  status: TaskStatus;
}

export interface PodCapacity {
  name: string;
  lead: string;
  pointsAllocated: number;
  pointsMax: number;
  percentage: number;
  gradient: string;
  tasksCount: number;
  status: "optimal" | "near_capacity" | "balanced";
}

export interface ActivityEvent {
  id: string;
  user: {
    name: string;
    initials: string;
    color: string;
    avatarUrl?: string;
  };
  action: string;
  target: string;
  timestamp: string;
  iconType: "move" | "pr" | "deploy" | "comment";
}

export interface ChatMessage {
  id: string;
  sender: {
    name: string;
    role: string;
    initials: string;
    color: string;
  };
  content: string;
  time: string;
  isEncrypted: boolean;
  reactions?: { emoji: string; count: number }[];
}

export interface RolePermission {
  id: string;
  role: string;
  badgeColor: string;
  summary: string;
  capabilities: {
    label: string;
    granted: boolean;
    description: string;
  }[];
}

export interface AIBlockerInsight {
  id: string;
  taskKey: string;
  title: string;
  impact: "High" | "Medium" | "Low";
  cause: string;
  suggestedAction: string;
  resolvedText: string;
  confidence: number;
}
