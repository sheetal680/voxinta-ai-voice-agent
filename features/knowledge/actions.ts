"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/action-result";
import { getEmbeddingProvider } from "@/services/embeddings";
import { getAgent } from "@/features/agents/queries";
import {
  CHUNK_OVERLAP,
  CHUNK_SIZE,
  KNOWLEDGE_MAX_FILE_SIZE_BYTES,
  MAX_CHUNKS_PER_DOCUMENT,
  type DocumentType,
} from "./constants";
import { chunkText } from "./lib/chunk-text";
import { resolveDocumentType } from "./lib/document-type";
import { extractText } from "./lib/extract-text";
import { toVectorLiteral } from "./lib/vector-literal";

/**
 * Server Actions backing /features/knowledge. Upload and processing are
 * deliberately two separate actions: uploadKnowledgeDocument stores the file
 * and returns fast (status "pending"); the client immediately follows up
 * with processKnowledgeDocument, which does the slow extract → chunk →
 * embed → store work and can be re-invoked on its own to retry a failed or
 * interrupted attempt without re-uploading the file.
 *
 * Vercel Functions default to a short duration; extraction + batch embedding
 * for a large document can legitimately take a while — the page(s) that call
 * these actions export `maxDuration` to extend it (a `"use server"` module's
 * own exports must all be async functions, so it can't be set here).
 */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadKnowledgeDocument(
  formData: FormData,
): Promise<ActionResult<{ documentId: string }>> {
  const file = formData.get("file");
  const agentId = formData.get("agentId");

  if (!(file instanceof File)) {
    return { success: false, message: "No file provided." };
  }
  if (typeof agentId !== "string" || !agentId) {
    return { success: false, message: "agentId is required." };
  }

  const documentType = resolveDocumentType(file.name);
  if (!documentType) {
    return {
      success: false,
      message: "Unsupported file type. Upload a PDF, DOCX, TXT, or Markdown file.",
    };
  }
  if (file.size > KNOWLEDGE_MAX_FILE_SIZE_BYTES) {
    return { success: false, message: "File must be 10MB or smaller." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const agent = await getAgent(agentId);
  if (!agent) {
    return { success: false, message: "Agent not found." };
  }

  const { data: document, error: insertError } = await supabase
    .from("knowledge_documents")
    .insert({
      owner_id: user.id,
      agent_id: agent.id,
      filename: file.name,
      type: documentType,
      size_bytes: file.size,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    return { success: false, message: insertError.message };
  }

  const storagePath = `${user.id}/${document.id}-${sanitizeFilename(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    await supabase
      .from("knowledge_documents")
      .update({ status: "failed", error: uploadError.message })
      .eq("id", document.id);
    return { success: false, message: uploadError.message };
  }

  const { error: updateError } = await supabase
    .from("knowledge_documents")
    .update({ storage_path: storagePath })
    .eq("id", document.id);
  if (updateError) {
    console.error("[knowledge] failed to record storage_path:", updateError.message);
  }

  revalidatePath(`/dashboard/agents/${agent.id}`);
  return { success: true, data: { documentId: document.id } };
}

export async function processKnowledgeDocument(documentId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { data: document } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("id", documentId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!document) {
    return { success: false, message: "Document not found." };
  }
  if (!document.storage_path) {
    return { success: false, message: "Document has no uploaded file to process." };
  }

  await supabase
    .from("knowledge_documents")
    .update({ status: "processing", error: null })
    .eq("id", documentId);

  try {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(document.storage_path);
    if (downloadError || !fileData) {
      throw new Error(downloadError?.message ?? "Failed to download the uploaded file.");
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const text = await extractText(buffer, document.type as DocumentType);

    if (!text.trim()) {
      throw new Error("No extractable text was found in this file.");
    }

    let chunks = chunkText(text, { chunkSize: CHUNK_SIZE, overlap: CHUNK_OVERLAP });
    if (chunks.length === 0) {
      throw new Error("No extractable text was found in this file.");
    }
    if (chunks.length > MAX_CHUNKS_PER_DOCUMENT) {
      chunks = chunks.slice(0, MAX_CHUNKS_PER_DOCUMENT);
    }

    // Clear any chunks left behind by a previous (failed/retried) attempt.
    await supabase.from("document_chunks").delete().eq("document_id", documentId);

    const provider = getEmbeddingProvider();
    const batchSize = 96; // comfortably within OpenAI's per-request input limit

    for (let offset = 0; offset < chunks.length; offset += batchSize) {
      const batch = chunks.slice(offset, offset + batchSize);
      const { embeddings } = await provider.embed({ input: batch });

      const rows = batch.map((content, index) => ({
        document_id: documentId,
        chunk_index: offset + index,
        content,
        embedding: toVectorLiteral(embeddings[index]),
      }));

      const { error: chunkInsertError } = await supabase.from("document_chunks").insert(rows);
      if (chunkInsertError) {
        throw new Error(chunkInsertError.message);
      }
    }

    await supabase
      .from("knowledge_documents")
      .update({ status: "ready", error: null })
      .eq("id", documentId);
    if (document.agent_id) {
      revalidatePath(`/dashboard/agents/${document.agent_id}`);
    }
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process document.";
    await supabase
      .from("knowledge_documents")
      .update({ status: "failed", error: message })
      .eq("id", documentId);
    if (document.agent_id) {
      revalidatePath(`/dashboard/agents/${document.agent_id}`);
    }
    return { success: false, message };
  }
}

export async function deleteKnowledgeDocument(documentId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { data: document } = await supabase
    .from("knowledge_documents")
    .select("agent_id, storage_path")
    .eq("id", documentId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!document) {
    return { success: false, message: "Document not found." };
  }

  const { error } = await supabase.from("knowledge_documents").delete().eq("id", documentId);
  if (error) {
    return { success: false, message: error.message };
  }

  if (document.storage_path) {
    const { error: removeError } = await supabase.storage
      .from("documents")
      .remove([document.storage_path]);
    if (removeError) {
      console.error("[knowledge] failed to remove storage file:", removeError.message);
    }
  }

  if (document.agent_id) {
    revalidatePath(`/dashboard/agents/${document.agent_id}`);
  }
  return { success: true };
}
