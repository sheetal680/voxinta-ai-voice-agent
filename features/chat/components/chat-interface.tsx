"use client";

import { useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { MicButton } from "@/features/voice/components/mic-button";
import { VoiceStatusBar } from "@/features/voice/components/voice-status-bar";
import { useVoiceConversation } from "@/features/voice/hooks/use-voice-conversation";
import { ChatComposer } from "./chat-composer";
import { MessageList } from "./message-list";
import type { ChatMessageItem } from "./message-bubble";

export function ChatInterface({
  conversationId,
  agentName,
  agentAvatarUrl,
  agentVoice,
  agentLanguage,
  initialMessages,
}: {
  conversationId: string;
  agentName: string;
  agentAvatarUrl?: string | null;
  agentVoice?: string | null;
  agentLanguage?: string | null;
  initialMessages: ChatMessageItem[];
}) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>();
  const abortControllerRef = useRef<AbortController | null>(null);

  async function streamReply(body: Record<string, unknown>) {
    setError(undefined);
    setIsStreaming(true);
    setStreamingContent("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let content = "";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? "Something went wrong. Please try again.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setStreamingContent(content);
      }
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "AbortError";
      if (!aborted) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      abortControllerRef.current = null;
      setIsStreaming(false);
      // Deliberately NOT clearing streamingContent here: useVoiceConversation
      // needs the final accumulated text once isStreaming flips to false, to
      // flush any trailing sentence that never hit closing punctuation. The
      // next streamReply() call resets it at the top, so nothing stale leaks
      // into the following turn.
      if (content.trim()) {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content }]);
      }
    }
  }

  function handleSend(userContent: string, options: { viaVoice?: boolean } = {}) {
    // A typed message arriving while a previous voice reply is still being
    // read aloud shouldn't let that stale speech run into this new turn.
    if (!options.viaVoice) {
      voice.cancelSpeaking();
    }
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: userContent },
    ]);
    void streamReply({ type: "message", conversationId, content: userContent });
  }

  function handleRegenerate() {
    voice.cancelSpeaking();
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      return last?.role === "assistant" ? prev.slice(0, -1) : prev;
    });
    void streamReply({ type: "regenerate", conversationId });
  }

  function handleStop() {
    abortControllerRef.current?.abort();
  }

  const voice = useVoiceConversation({
    streamingContent,
    isStreaming,
    voiceId: agentVoice,
    lang: agentLanguage,
    onFinalTranscript: (transcript) => handleSend(transcript, { viaVoice: true }),
  });

  return (
    <div className="flex h-[70vh] min-h-[500px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md">
      <MessageList
        messages={messages}
        agentName={agentName}
        agentAvatarUrl={agentAvatarUrl}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        onRegenerate={handleRegenerate}
      />
      {error && (
        <div className="px-4 sm:px-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      <VoiceStatusBar status={voice.status} interimTranscript={voice.interimTranscript} />
      <ChatComposer
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
        leadingSlot={
          <MicButton status={voice.status} isSupported={voice.isSupported} onClick={voice.toggleMic} />
        }
      />
    </div>
  );
}
