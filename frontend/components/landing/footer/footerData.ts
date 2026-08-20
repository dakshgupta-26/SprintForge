export interface FooterLinkItem {
  label: string;
  href: string;
  isExternal?: boolean;
  badge?: string;
}

export interface FooterColumnDef {
  title: string;
  links: FooterLinkItem[];
}

export const footerColumns: FooterColumnDef[] = [
  {
    title: "Product",
    links: [
      { label: "Core Features", href: "#features" },
      { label: "Smart Sprint Planning", href: "#sprint-planning" },
      { label: "Kanban & Scrum", href: "#kanban-scrum" },
      { label: "Real-Time Presence", href: "#live-presence" },
      { label: "Encrypted Team Chat", href: "#team-chat" },
      { label: "AI Sprint Copilot", href: "#ai-advantage", badge: "AI" },
      { label: "Interactive Demo", href: "#interactive-demo" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Philosophy", href: "#about" },
      { label: "Pune Engineering HQ", href: "#about" },
      { label: "Contact Engineering", href: "mailto:sprintforge@gmail.com", isExternal: true },
      { label: "Workspace Sign In", href: "/login" },
      { label: "Get Started Free", href: "/signup", badge: "Free" },
    ],
  },
  {
    title: "Resources & Security",
    links: [
      { label: "Interactive Product Sandbox", href: "#interactive-demo" },
      { label: "Agile Workflow Evolution", href: "#workflow" },
      { label: "Enterprise RBAC Matrix", href: "#permissions-rbac" },
      { label: "End-to-End Encryption", href: "#team-chat" },
      { label: "SOC-2 & Data Security", href: "#about" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Security Commitments", href: "#about" },
      { label: "Data Governance", href: "/privacy" },
    ],
  },
];
