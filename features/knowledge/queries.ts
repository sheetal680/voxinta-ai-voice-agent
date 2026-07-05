import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { KnowledgeDocument } from "@/types/database";

/**
 * Read-side data access for the knowledge base. Plain async functions (not
 * Server Actions) — called directly from Server Components. RLS scopes
 * every query to the caller's own documents.
 */

export const getDocuments = cache(async (agentId: string): Promise<KnowledgeDocument[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("knowledge", "getDocuments failed", error);
    return [];
  }

  return data;
});

export const getDocument = cache(async (id: string): Promise<KnowledgeDocument | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logger.error("knowledge", "getDocument failed", error);
    return null;
  }

  return data;
});
