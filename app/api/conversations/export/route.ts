import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { buildConversationsCsv, buildConversationsJson } from "@/features/chat/lib/export";
import { getConversationsForExport, listConversations } from "@/features/chat/queries";
import { conversationsExportQuerySchema } from "@/features/chat/schemas";

/**
 * GET /api/conversations/export — downloads a JSON or CSV transcript export.
 *
 * A Route Handler rather than a Server Action: this is fundamentally a file
 * download (the browser needs a real HTTP response with Content-Disposition
 * to save it), the same reasoning that put streaming in a Route Handler for
 * /api/chat. Two ways to select which conversations to export:
 *   - `ids=<uuid,uuid,...>` — an explicit set (e.g. one row's "Export").
 *   - otherwise, the same `agentId`/`search`/`from`/`to` filters as the
 *     Conversations list — so "Export all" exports whatever's on screen.
 */
export async function GET(request: NextRequest) {
  try {
    return await handleExport(request);
  } catch (error) {
    logger.error("conversations-export", "Unexpected failure exporting conversations", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

async function handleExport(request: NextRequest): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "You must be signed in." }, { status: 401 });
  }

  const parsedQuery = conversationsExportQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsedQuery.success) {
    return NextResponse.json(
      { success: false, message: parsedQuery.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }
  const { format, ids, agentId, search, from, to } = parsedQuery.data;

  const conversationIds = ids
    ? ids.split(",").filter(Boolean)
    : (
        await listConversations({
          agentId,
          search,
          fromDate: from,
          toDate: to,
        })
      ).map((conversation) => conversation.id);

  if (conversationIds.length === 0) {
    return NextResponse.json({ success: false, message: "No conversations to export." }, { status: 404 });
  }

  const conversations = await getConversationsForExport(conversationIds);
  const body = format === "csv" ? buildConversationsCsv(conversations) : buildConversationsJson(conversations);
  const contentType = format === "csv" ? "text/csv" : "application/json";
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="voxinta-conversations-${date}.${format}"`,
    },
  });
}
