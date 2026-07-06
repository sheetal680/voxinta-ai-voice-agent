/**
 * PLACEHOLDER COPY — every string in this file is a stand-in for real
 * marketing content and is meant to be rewritten before launch. Kept in one
 * file so copy can be edited without touching layout/component code.
 */

export const heroContent = {
  eyebrow: "AI Voice Agent Platform",
  headline: "Give your product a voice that never sleeps.",
  subheadline:
    "Voxinta turns a prompt into a live voice agent — one that listens, remembers, searches your docs, and calls your tools. Ship it in an afternoon, not a quarter.",
  primaryCta: { label: "Start free", href: "/signup" },
  secondaryCta: { label: "See it in action", href: "#ai-demo" },
  trustNote: "No credit card required · Free tier included",
};

export const features = [
  {
    icon: "Mic" as const,
    title: "Natural voice conversations",
    description:
      "Real-time speech in, speech out — tuned for low latency so conversations feel like talking to a person, not a phone tree.",
  },
  {
    icon: "BrainCircuit" as const,
    title: "Short- and long-term memory",
    description:
      "Agents remember the current conversation and carry context, preferences, and history forward into the next one.",
  },
  {
    icon: "FileSearch" as const,
    title: "Knowledge base (RAG)",
    description:
      "Upload PDFs, docs, and notes. Your agent chunks, embeds, and retrieves the right passage the moment it's needed.",
  },
  {
    icon: "Wrench" as const,
    title: "Plug-in tool calling",
    description:
      "Calculator, web search, calendar, custom REST APIs — give an agent new abilities by wiring up a tool, not rewriting its brain.",
  },
  {
    icon: "Users" as const,
    title: "Multi-agent workspace",
    description:
      "Spin up specialized agents — support, sales, tutor, assistant — each with its own prompt, memory, and documents.",
  },
  {
    icon: "BarChart3" as const,
    title: "Usage analytics",
    description:
      "Conversations, response time, and adoption trends in one dashboard, so you know what's working before your customers tell you.",
  },
];

/** Canned script driving the AI Demo section's fake conversation. Not a live agent. */
export const aiDemoScript = {
  agentName: "Voxinta Assistant",
  transcript: "Book me a table for two tonight at 7.",
  response:
    "Done — you're booked for two at The Garden Bistro tonight at 7:00 PM. Want me to add it to your calendar?",
};

export const faqs = [
  {
    question: "Is Voxinta live during a real phone call, or just in-browser?",
    answer:
      "The MVP runs in-browser using native speech recognition and synthesis. Phone and WhatsApp integrations are on the roadmap.",
  },
  {
    question: "Which AI models power the agent?",
    answer:
      "Voxinta runs on Groq by default, with the architecture built to swap in OpenAI, Claude, Gemini, or a local model without changing how you configure an agent.",
  },
  {
    question: "Can I upload my own documents for the agent to reference?",
    answer:
      "Yes — PDF, DOCX, TXT, and Markdown are supported. Documents are chunked and embedded so the agent can pull the right passage into a conversation.",
  },
  {
    question: "What happens to my conversation data?",
    answer:
      "Conversations are stored per-account with row-level security, so only you (and your team, on team plans) can access them.",
  },
  {
    question: "Do I need to write code to add a tool?",
    answer:
      "Common tools (calculator, web search, calendar) are ready to enable. Custom tools follow a plugin interface for your own APIs.",
  },
];

export const ctaContent = {
  headline: "Ready to give your product a voice?",
  subheadline: "Start free. Upgrade when your agents start doing real work.",
  primaryCta: { label: "Start free", href: "/signup" },
};
