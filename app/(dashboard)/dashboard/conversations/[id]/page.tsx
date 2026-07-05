import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getAgent } from "@/features/agents/queries";
import { ChatInterface } from "@/features/chat/components/chat-interface";
import type { ChatMessageItem } from "@/features/chat/components/message-bubble";
import { getConversation, getMessages } from "@/features/chat/queries";

// Depends on the caller's cookie-scoped auth session — must never be
// statically prerendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const conversation = await getConversation(id);
  const agent = conversation?.agent_id ? await getAgent(conversation.agent_id) : null;
  return { title: agent ? `Chat with ${agent.name} — Voxinta` : "Conversation — Voxinta" };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await getConversation(id);

  if (!conversation) {
    notFound();
  }

  const [agent, messages] = await Promise.all([
    conversation.agent_id ? getAgent(conversation.agent_id) : Promise.resolve(null),
    getMessages(id),
  ]);

  const chatMessages: ChatMessageItem[] = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={agent ? `/dashboard/agents/${agent.id}` : "/dashboard/agents"}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to agent"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{agent?.name ?? "Agent"}</h1>
          <p className="text-xs text-muted-foreground">
            {agent ? "Chatting with this agent" : "This agent has been deleted."}
          </p>
        </div>
      </div>

      <ChatInterface
        conversationId={conversation.id}
        agentName={agent?.name ?? "Agent"}
        agentAvatarUrl={agent?.avatar_url}
        agentVoice={agent?.voice}
        agentLanguage={agent?.language}
        initialMessages={chatMessages}
      />
    </div>
  );
}
