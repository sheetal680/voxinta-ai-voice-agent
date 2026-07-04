@AGENTS.md

# Voxinta AI Voice Agent

> Read `AGENTS.md` (imported above) **before writing any Next.js code** — this Next.js version has breaking changes vs. training data.

## What this is

**Voxinta** is a **production SaaS product** (an AI Voice Agent platform), not a demo or prototype. Every decision should be made as if this ships to paying customers. The full product spec lives in [`PRD.md`](./PRD.md) — consult it before adding features.

## Non-negotiable constraints

- **Vercel-only deployment.** The entire app deploys on Vercel (Next.js App Router, Vercel Functions, Edge Functions where appropriate, Vercel Blob, Vercel Cron). **No Docker, no Render, no Railway, no Koyeb, no separate backend repo.** Everything lives in this single Next.js codebase. Do not introduce anything that can't run on Vercel.
- **Strict TypeScript everywhere.** `strict: true` is on and stays on. No `any` escape hatches, no `// @ts-ignore` without justification.
- **Zod validation on all inputs.** Every API route, server action, and form validates its input with a Zod schema. Consistent, typed API responses.
- **Small, incremental commits.** Ship modular features in clean, focused commits. One concern per commit.

## Architecture

- **Feature-based architecture.** Domain code lives under `/features/*` (chat, voice, agents, knowledge, analytics, settings). Keep frontend, API routes, business logic, and UI well separated.
- **All external providers sit behind interfaces in `/services`.** LLM, STT, TTS, and embeddings must each be accessed through a provider-agnostic interface so implementations are swappable **without touching business logic**. MVP implementations:
  - **LLM** → Groq (future: OpenAI, Claude, Gemini, Ollama)
  - **STT** → browser-native Speech Recognition (future: Whisper API, Faster Whisper)
  - **TTS** → browser `SpeechSynthesis` (future: ElevenLabs, OpenAI TTS, Piper)
  - **Embeddings** → abstracted service (provider swappable)
  - **Memory / RAG** → Supabase/Postgres for the Vercel MVP (LangChain/Chroma interface kept future-ready)
- **Data & auth** → Supabase (Postgres, Auth, Storage, Row Level Security).
- **Centralized config** via environment variables. Never hardcode provider keys or endpoints.

## Directory map

```
/app/(landing) /app/(dashboard) /app/(auth) /app/api   # route groups + API
/components        # shared, reusable UI (shadcn in components/ui)
/features/*        # chat, voice, agents, knowledge, analytics, settings
/lib               # shared utilities (cn, clients)
/services          # provider interfaces + implementations (LLM/STT/TTS/embeddings)
/hooks /types /utils /styles /public
```

## Coding standards

- Reusable components, SOLID principles, clean and documented code.
- Server-side work only where it improves performance/security on Vercel.
- Error boundaries, logging, and accessibility support throughout.
- Optimize for maintainability, scalability, security, and low latency.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS · Shadcn UI (neutral base) · Framer Motion · React Hook Form · Zod · Supabase · Groq.
