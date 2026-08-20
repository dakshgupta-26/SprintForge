export interface LifecycleNode {
  id: string;
  stage: string;
  label: string;
  sublabel: string;
  status: "completed" | "active" | "queued";
  badge: string;
  badgeColor: string;
}

export interface PrincipleItem {
  id: string;
  number: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
}

export interface CollaboratorCursor {
  name: string;
  action: string;
  color: string;
  initialX: number;
  initialY: number;
}
