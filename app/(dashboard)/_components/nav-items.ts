import {
  BarChart3,
  Bot,
  FileText,
  Gauge,
  LayoutDashboard,
  MessagesSquare,
  Plug,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

/**
 * Single source of truth for the dashboard's top-level sections — drives
 * both the sidebar nav and the Overview page's quick links.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Your workspace at a glance.",
  },
  {
    title: "AI Agents",
    href: "/dashboard/agents",
    icon: Bot,
    description: "Create and configure your voice agents.",
  },
  {
    title: "Conversations",
    href: "/dashboard/conversations",
    icon: MessagesSquare,
    description: "Browse and search past conversations.",
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    description: "Usage trends, response time, and adoption.",
  },
  {
    title: "Knowledge Base",
    href: "/dashboard/knowledge",
    icon: FileText,
    description: "Upload documents your agents can reference.",
  },
  {
    title: "Integrations",
    href: "/dashboard/integrations",
    icon: Plug,
    description: "Connect tools like calendars and web search.",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Profile, theme, and notification preferences.",
  },
  {
    title: "Usage",
    href: "/dashboard/usage",
    icon: Gauge,
    description: "Track plan limits and voice minutes.",
  },
];
