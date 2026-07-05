import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildConversationsCsv, buildConversationsJson } from "@/features/chat/lib/export";
import { getConversationsForExport, listConversations } from "@/features/chat/queries";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "You must be signed in." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const format = params.get("format") === "csv" ? "csv" : "json";
  const idsParam = params.get("ids");

  const conversationIds = idsParam
    ? idsParam.split(",").filter(Boolean)
    : (
        await listConversations({
          agentId: params.get("agentId") ?? undefined,
          search: params.get("search") ?? undefined,
          fromDate: params.get("from") ?? undefined,
          toDate: params.get("to") ?? undefined,
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
