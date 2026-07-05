import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getPlatformReport } from "@/features/admin/queries";
import { reportExportQuerySchema } from "@/features/admin/schemas";

/**
 * GET /api/admin/report/export — downloads a JSON or CSV snapshot of the
 * platform report. A Route Handler (not a Server Action) for the same
 * reason as /api/conversations/export: a file download needs a real HTTP
 * response with Content-Disposition, not a Server Action's return value.
 *
 * Deliberately Node (the default), not Edge — same reasoning as
 * /api/conversations/export: an occasional admin download, not a
 * latency-sensitive path.
 */
export async function GET(request: NextRequest) {
  try {
    return await handleExport(request);
  } catch (error) {
    logger.error("admin-report-export", "Unexpected failure exporting platform report", error);
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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
  }

  const report = await getPlatformReport();
  if (!report) {
    return NextResponse.json({ success: false, message: "Report unavailable." }, { status: 500 });
  }

  const parsedQuery = reportExportQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsedQuery.success) {
    return NextResponse.json(
      { success: false, message: parsedQuery.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }
  const { format } = parsedQuery.data;
  const date = new Date().toISOString().slice(0, 10);

  const body =
    format === "csv"
      ? [
          "metric,value",
          `total_users,${report.totalUsers}`,
          `total_agents,${report.totalAgents}`,
          `total_conversations,${report.totalConversations}`,
          `total_messages,${report.totalMessages}`,
          `total_tool_calls,${report.totalToolCalls}`,
          `avg_response_time_ms,${report.avgResponseTimeMs ?? ""}`,
          `total_documents,${report.totalDocuments}`,
          `failed_documents,${report.failedDocuments}`,
        ].join("\r\n")
      : JSON.stringify(report, null, 2);

  return new NextResponse(body, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="voxinta-platform-report-${date}.${format}"`,
    },
  });
}
