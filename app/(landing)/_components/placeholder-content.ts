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

export const pricingTiers = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "For trying Voxinta out and building your first agent.",
    features: [
      "1 AI agent",
      "100 voice minutes / mo",
      "Community support",
      "Browser voice (STT/TTS)",
    ],
    cta: { label: "Start free", href: "/signup" },
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For teams shipping a real product with Voxinta.",
    features: [
      "Unlimited agents",
      "2,000 voice minutes / mo",
      "Knowledge base (RAG)",
      "Tool calling",
      "Priority support",
    ],
    cta: { label: "Start free trial", href: "/signup" },
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For orgs that need scale, security, and white-glove support.",
    features: [
      "Everything in Pro",
      "SSO & audit logs",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: { label: "Talk to us", href: "/signup" },
    highlighted: false,
  },
];

export const testimonials = [
  {
    quote:
      "We replaced our IVR tree with a Voxinta agent in a week. Support call time dropped almost in half.",
    name: "Priya Nair",
    role: "Head of Support, Placeholder Co.",
  },
  {
    quote:
      "The knowledge base hookup meant our agent actually knew our product docs on day one. That's rare.",
    name: "Marcus Webb",
    role: "Founder, Sample Labs",
  },
  {
    quote:
      "Being able to spin up a separate sales agent and support agent from the same dashboard is exactly what we needed.",
    name: "Elena Torres",
    role: "Ops Lead, Acme Example Inc.",
  },
];

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
  secondaryCta: { label: "View pricing", href: "#pricing" },
};
