import { NextRequest, NextResponse } from "next/server";
import { executeRAGStream } from "@/services/rag-service";
import {
  requireWorkspaceMember,
  requireConversationAccess,
} from "@/lib/auth/require-workspace-member";
import { AuthError } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, workspaceId, documentIds, conversationId, provider, model } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "A valid 'question' string is required." },
        { status: 400 }
      );
    }

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json({ error: "A valid 'workspaceId' is required." }, { status: 400 });
    }

    // 1. Verify caller is authenticated and belongs to the workspace
    const { user } = await requireWorkspaceMember(workspaceId);

    // 2. Enforce DB-backed rate limiting before calling AI LLM
    const rateLimit = await checkRateLimit(workspaceId, user.id, "chat", 30, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. You have reached the maximum of ${rateLimit.limit} queries per minute. Please try again in ${rateLimit.resetSeconds}s.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetSeconds),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        }
      );
    }

    // 3. If conversationId is supplied, verify caller has access to it
    if (conversationId) {
      await requireConversationAccess(conversationId, workspaceId);
    }

    // 3. If documentIds are specified, verify they belong to this workspace
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      const adminDb = createAdminClient();
      const { data: validDocs, error: docCheckError } = await adminDb
        .from("documents")
        .select("id")
        .eq("workspace_id", workspaceId)
        .in("id", documentIds);

      if (docCheckError) {
        console.error("[POST /api/chat] Document verification error:", docCheckError);
        return NextResponse.json({ error: "Failed to verify document access." }, { status: 500 });
      }

      const validDocIds = new Set((validDocs || []).map((d) => d.id));
      const hasInvalidDoc = documentIds.some((id: string) => !validDocIds.has(id));
      if (hasInvalidDoc) {
        return NextResponse.json(
          { error: "One or more requested documents do not belong to this workspace." },
          { status: 403 }
        );
      }
    }

    // 4. Execute RAG LangChain pipeline with verified session user.id
    const { stream } = await executeRAGStream({
      question,
      workspaceId,
      userId: user.id, // Strictly derived from auth session
      documentIds,
      conversationId,
      provider,
      model,
      abortSignal: req.signal,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message =
      error instanceof Error ? error.message : "Internal server error during chat processing.";
    console.error("[POST /api/chat] Unexpected error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
