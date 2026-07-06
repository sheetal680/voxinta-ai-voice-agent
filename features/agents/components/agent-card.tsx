import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Agent } from "@/types/database";

function initialsFrom(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || "AI";
}

export function AgentCard({ agent, href }: { agent: Agent; href?: string }) {
  return (
    <Link href={href ?? `/dashboard/agents/${agent.id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={agent.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{initialsFrom(agent.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{agent.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {agent.description || "No description yet."}
            </CardDescription>
          </div>
          {!agent.is_active && <Badge variant="secondary">Inactive</Badge>}
        </CardHeader>
      </Card>
    </Link>
  );
}
