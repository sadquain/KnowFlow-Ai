import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId query parameter." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Total documents count & breakdown by status
    const { data: docs, error: docsError } = await supabase
      .from("documents")
      .select("id, status, file_type, chunk_count, created_at, title")
      .eq("workspace_id", workspaceId);

    if (docsError) {
      return NextResponse.json({ error: docsError.message }, { status: 500 });
    }

    const activeDocs = docs || [];
    const totalDocs = activeDocs.length;
    const readyDocs = activeDocs.filter((d) => d.status === "ready").length;
    const processingDocs = activeDocs.filter((d) => d.status === "processing").length;
    const failedDocs = activeDocs.filter((d) => d.status === "failed").length;
    const totalChunks = activeDocs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);

    // 2. AI Usage metrics
    const { data: usage, error: usageError } = await supabase
      .from("ai_usage")
      .select("id, provider, model, latency_ms, status, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (usageError) {
      return NextResponse.json({ error: usageError.message }, { status: 500 });
    }

    const totalQueries = usage?.length || 0;
    const successfulQueries = usage?.filter((u) => u.status === "success").length || 0;
    const failedQueries = usage?.filter((u) => u.status === "failed" || u.status === "cancelled").length || 0;
    const avgLatency =
      totalQueries > 0
        ? Math.round(
            (usage?.reduce((acc, u) => acc + (u.latency_ms || 0), 0) || 0) / totalQueries
          )
        : 0;

    return NextResponse.json({
      metrics: {
        totalDocuments: totalDocs,
        readyDocuments: readyDocs,
        processingDocuments: processingDocs,
        failedDocuments: failedDocs,
        totalChunks,
        totalQueries,
        successfulQueries,
        failedQueries,
        averageLatencyMs: avgLatency,
      },
      recentDocuments: activeDocs.slice(0, 5),
      recentUsage: usage?.slice(0, 5) || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load analytics.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
