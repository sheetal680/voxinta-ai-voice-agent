# `/services` — Provider Abstraction Layer

This is the most important architectural boundary in Voxinta. **All external
providers — LLM, STT, TTS, embeddings — live behind interfaces here so they can
be swapped without touching business logic.** Business/UI code depends on the
_interface_ and the _factory_, never on a concrete vendor.

> Rule: nothing outside `/services` should import a concrete provider class
> (e.g. `GroqProvider`) or a vendor SDK directly. Go through the factory.

## The pattern

Each domain folder (`llm/`, `stt/`, `tts/`, `embeddings/`) follows the same shape:

```
services/<domain>/
  <domain>.interface.ts   # I<Domain>Provider — the contract
  <domain>.registry.ts    # registry + get<Domain>Provider() factory
  providers/              # concrete implementations of the interface
  index.ts                # public surface of the domain
```

Shared building blocks live in `services/shared/`:

- `registry.ts` — generic `ProviderRegistry<Id, Provider>` (id → lazy factory).
- `errors.ts` — `ProviderError` (normalized error every provider throws).
- `env.ts` — `getEnv` / `requireEnv` for centralized config.

Provider-agnostic **data types** (message shapes, params, results) live in
[`/types`](../types), not here. Interfaces reference those types; the split
keeps `@/types` importable by UI without pulling in the service layer.

## How selection works

The active provider is chosen at runtime from an environment variable, with a
safe default. Override in code by passing an explicit id.

| Domain     | Env var                     | Default       | Runtime      |
| ---------- | --------------------------- | ------------- | ------------ |
| LLM        | `LLM_PROVIDER`              | `groq`        | server       |
| STT        | `NEXT_PUBLIC_STT_PROVIDER`  | `browser`     | client       |
| TTS        | `NEXT_PUBLIC_TTS_PROVIDER`  | `browser`     | client       |
| Embeddings | `EMBEDDING_PROVIDER`        | `openai`      | server       |

STT/TTS use the `NEXT_PUBLIC_` prefix because selection happens in the browser.
LLM/embeddings keys and selection stay server-side only.

## Usage

```ts
// Server (route handler / server action) — LLM
import { getLLMProvider } from "@/services/llm";

const llm = getLLMProvider();                 // env-selected (Groq by default)
const res = await llm.generate({
  messages: [{ role: "user", content: "Hi" }],
  temperature: 0.7,
  maxTokens: 512,
});

for await (const chunk of llm.streamGenerate({ messages })) {
  if (!chunk.done) process(chunk.delta);
}
```

```ts
// Client (voice UI) — STT + TTS
"use client";
import { getSTTProvider } from "@/services/stt";
import { getTTSProvider } from "@/services/tts";

const stt = getSTTProvider();
stt.start({ lang: "en-US" }, { onResult: (r) => r.isFinal && send(r.transcript) });

const tts = getTTSProvider();
await tts.speak("Hello there.");
```

> Import from the specific domain (`@/services/llm`, `@/services/stt`, …), **not**
> from a single root barrel — that keeps server-only providers (Groq) out of
> client bundles and vice-versa.

## Adding a new provider

1. If it's a new vendor, add its id to the relevant union in `/types`
   (`LLMProviderId`, `STTProviderId`, `TTSProviderId`, `EmbeddingProviderId`).
2. Create `providers/<vendor>.provider.ts` implementing the domain interface.
   Throw `ProviderError` for failures; read config via `getEnv`/`requireEnv`.
3. Register it in the domain's `*.registry.ts`:
   `registry.register("<id>", () => new <Vendor>Provider())`.
4. Export it from the domain `index.ts`.
5. Point the env var at it. **No business/UI code changes.**

## Current implementations

- **LLM** — `GroqProvider` (Groq OpenAI-compatible API, no SDK, streams via SSE).
  Future: OpenAI, Claude, Gemini, Ollama.
- **STT** — `BrowserSTTProvider` (Web Speech API, client-side). Future: Whisper
  API / Faster Whisper (server-side, same session interface).
- **TTS** — `BrowserTTSProvider` (SpeechSynthesis, client-side). Future:
  ElevenLabs, OpenAI TTS, Piper.
- **Embeddings** — `OpenAIEmbeddingProvider` (`text-embedding-3-small`, 1536
  dimensions, matches `document_chunks.embedding`). Future: Cohere/local.
  `PlaceholderEmbeddingProvider` remains registered for environments with no
  key configured.
