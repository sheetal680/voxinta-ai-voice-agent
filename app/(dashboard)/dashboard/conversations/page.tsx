import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";

export const metadata: Metadata = { title: "Conversations — Voxinta" };

export default function ConversationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search, filter, and review every conversation your agents have had.
        </p>
      </div>

      <EmptyState
        icon={MessagesSquare}
        title="No conversations yet"
        description="Once your agents start talking with users, conversations will show up here."
      />
    </div>
  );
}
