import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard — Voxinta" };

/**
 * Placeholder landing page for the authenticated app shell. The full
 * dashboard (agents, conversations, analytics, knowledge base, ...) is
 * built out in later modules — this page exists so the auth flow and route
 * protection have somewhere real to land.
 */
export default function DashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Your agents, conversations, and analytics will live here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Dashboard modules coming soon.</p>
      </CardContent>
    </Card>
  );
}
