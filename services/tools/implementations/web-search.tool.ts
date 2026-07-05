import { z } from "zod";
import { ProviderError } from "@/services/shared/errors";
import type { ITool } from "../tools.interface";

/**
 * Web search tool backed by Wikipedia's search API
 * (https://www.mediawiki.org/wiki/API:Search) — free, needs no API key, and
 * reliably returns real results with snippets for most factual/background
 * queries, unlike no-key "instant answer" APIs that only cover a narrow set
 * of topics. Scoped honestly: this searches Wikipedia, not the open web.
 */
const SEARCH_URL = "https://en.wikipedia.org/w/api.php";
const MAX_RESULTS = 3;

interface WikipediaSearchResult {
  title: string;
  snippet: string;
}

interface WikipediaSearchResponse {
  query?: {
    search?: WikipediaSearchResult[];
  };
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "");
}

async function searchWikipedia(query: string): Promise<WikipediaSearchResult[]> {
  const url =
    `${SEARCH_URL}?action=query&list=search&format=json&origin=*` +
    `&srlimit=${MAX_RESULTS}&srsearch=${encodeURIComponent(query)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new ProviderError("tools", "Failed to reach the search service.", {
      cause,
      providerId: "web_search",
      retryable: true,
    });
  }
  if (!response.ok) {
    throw new ProviderError("tools", `Search service error ${response.status}.`, {
      providerId: "web_search",
      status: response.status,
      retryable: response.status >= 500,
    });
  }

  const data = (await response.json()) as WikipediaSearchResponse;
  return data.query?.search ?? [];
}

const parameters = z.object({
  query: z.string().describe("The topic or question to search for."),
});

export const webSearchTool: ITool<z.infer<typeof parameters>> = {
  name: "web_search",
  description:
    "Searches Wikipedia for background/factual information on a topic and returns brief summaries " +
    "of the most relevant articles. Best for definitions, facts, history, and general knowledge — " +
    "not for current events or real-time information.",
  parameters,
  async execute({ query }) {
    const results = await searchWikipedia(query);
    if (results.length === 0) {
      return `No Wikipedia results found for "${query}".`;
    }
    return results
      .map((result, index) => `${index + 1}. ${result.title} — ${stripHtml(result.snippet)}`)
      .join("\n");
  },
};
