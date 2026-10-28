import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/require-workspace-member";
import { AuthError } from "@/lib/auth/require-user";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId query parameter." }, { status: 400 });
    }

    // Verify authenticated caller belongs to this workspace (RLS client)
    const { supabase } = await requireWorkspaceMember(workspaceId);

    // 1. Real SQL count aggregates for documents using exact head counts
    const [
      { count: totalDocs, error: totalDocsErr },
      { count: readyDocs },
      { count: processingDocs },
      { count: failedDocs },
      { count: totalChunks },
    ] = await Promise.all([
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "ready"),
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "processing"),
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "failed"),
      supabase.from("document_chunks").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    ]);

    if (totalDocsErr) {
      console.error("[GET /api/analytics] Documents count error:", totalDocsErr);
      return NextResponse.json({ error: totalDocsErr.message }, { status: 500 });
    }

    // 2. Real SQL count aggregates for AI usage telemetry
    const [
      { count: totalQueries, error: totalQueriesErr },
      { count: successfulQueries },
      { count: failedQueries },
    ] = await Promise.all([
      supabase.from("ai_usage").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      supabase.from("ai_usage").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "success"),
      supabase.from("ai_usage").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).in("status", ["failed", "cancelled"]),
    ]);

    if (totalQueriesErr) {
      console.error("[GET /api/analytics] AI usage count error:", totalQueriesErr);
      return NextResponse.json({ error: totalQueriesErr.message }, { status: 500 });
    }

    // 3. Compute accurate average latency and token totals
    const { data: usageTelemetry } = await supabase
      .from("ai_usage")
      .select("latency_ms, prompt_tokens, completion_tokens, total_tokens, provider, model, status")
      .eq("workspace_id", workspaceId);

    let avgLatency = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    const providerCounts: Record<string, number> = {};

    if (usageTelemetry && usageTelemetry.length > 0) {
      const successfulRuns = usageTelemetry.filter((u) => u.status === "success" && typeof u.latency_ms === "number");
      if (successfulRuns.length > 0) {
        const sumLatency = successfulRuns.reduce((acc, u) => acc + (u.latency_ms || 0), 0);
        avgLatency = Math.round(sumLatency / successfulRuns.length);
      }

      for (const u of usageTelemetry) {
        totalPromptTokens += u.prompt_tokens || 0;
        totalCompletionTokens += u.completion_tokens || 0;
        const p = u.provider || "unknown";
        providerCounts[p] = (providerCounts[p] || 0) + 1;
      }
    }

    // 4. File type distribution from documents
    const { data: docTypes } = await supabase
      .from("documents")
      .select("file_type")
      .eq("workspace_id", workspaceId);

    const typeDistribution: Record<string, number> = {};
    if (docTypes) {
      for (const d of docTypes) {
        const t = d.file_type?.toLowerCase() || "other";
        const normalized = t.includes("pdf")
          ? "PDF"
          : t.includes("word") || t.includes("docx")
          ? "DOCX"
          : t.includes("markdown") || t.includes("md")
          ? "Markdown"
          : t.includes("plain") || t.includes("txt")
          ? "TXT"
          : "Other";
        typeDistribution[normalized] = (typeDistribution[normalized] || 0) + 1;
      }
    }

    // 5. Recent usage log (for telemetry table view)
    const { data: recentUsage } = await supabase
      .from("ai_usage")
      .select("id, provider, model, latency_ms, status, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      metrics: {
        totalDocuments: totalDocs || 0,
        readyDocuments: readyDocs || 0,
        processingDocuments: processingDocs || 0,
        failedDocuments: failedDocs || 0,
        totalChunks: totalChunks || 0,
        totalQueries: totalQueries || 0,
        successfulQueries: successfulQueries || 0,
        failedQueries: failedQueries || 0,
        averageLatencyMs: avgLatency,
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
      },
      typeDistribution,
      providerCounts,
      recentUsage: recentUsage || [],
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to load analytics.";
    console.error("[GET /api/analytics] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
