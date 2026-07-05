"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Agent } from "@/types/database";

// Sentinel for the "All agents" option — Base UI's Select treats an empty
// string value ambiguously with "nothing selected", so the URL's absence of
// `agent` (not an empty-string value) is what means "no filter".
const ALL_AGENTS = "__all__";

export function ConversationFilters({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(next.size > 0 ? `${pathname}?${next.toString()}` : pathname);
  }

  // Debounces the search box into the URL. This is a legitimate effect —
  // syncing local input state to an external system (the URL/server query)
  // after a delay — not the "derive state from props" pattern the
  // react-hooks/set-state-in-effect lint guards against.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (search === current) return;
    const timeout = setTimeout(() => updateParam("q", search), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the debounced value changes
  }, [search]);

  const agentParam = searchParams.get("agent");
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const hasFilters = Boolean(searchParams.get("q") || agentParam || fromParam || toParam);

  function clearAll() {
    setSearch("");
    router.replace(pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search conversations…"
          className="pl-8"
          aria-label="Search conversations"
        />
      </div>

      <Select
        items={{ [ALL_AGENTS]: "All agents", ...Object.fromEntries(agents.map((a) => [a.id, a.name])) }}
        value={agentParam ?? ALL_AGENTS}
        onValueChange={(value) => updateParam("agent", value === ALL_AGENTS ? "" : (value ?? ""))}
      >
        <SelectTrigger className="w-40" aria-label="Filter by agent">
          <SelectValue placeholder="All agents" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_AGENTS}>All agents</SelectItem>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              {agent.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={fromParam}
        onChange={(event) => updateParam("from", event.target.value)}
        className="w-36"
        aria-label="From date"
      />
      <Input
        type="date"
        value={toParam}
        onChange={(event) => updateParam("to", event.target.value)}
        className="w-36"
        aria-label="To date"
      />

      {hasFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
          <X /> Clear
        </Button>
      )}
    </div>
  );
}
