import {
  BarChart3,
  FileClock,
  FlaskConical,
  MessagesSquare,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

/** Single source of truth for the admin panel's sub-sections. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    title: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    description: "Every account on the platform and their role.",
  },
  {
    title: "Conversation Logs",
    href: "/dashboard/admin/conversations",
    icon: MessagesSquare,
    description: "Every conversation across every user.",
  },
  {
    title: "Analytics",
    href: "/dashboard/admin/analytics",
    icon: BarChart3,
    description: "Platform-wide usage trends and response time.",
  },
  {
    title: "Reports",
    href: "/dashboard/admin/reports",
    icon: FileClock,
    description: "A snapshot summary of platform activity.",
  },
  {
    title: "System Monitoring",
    href: "/dashboard/admin/monitoring",
    icon: ShieldCheck,
    description: "Configuration health and recent failures.",
  },
  {
    title: "Feature Flags",
    href: "/dashboard/admin/feature-flags",
    icon: FlaskConical,
    description: "Roll features out without a deploy.",
  },
];
