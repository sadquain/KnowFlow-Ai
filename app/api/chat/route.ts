import { NextRequest, NextResponse } from "next/server";
import { executeRAGStream } from "@/services/rag-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to send messages." },
        { status: 401 }
      );
    }
    const userId = user.id;

    const body = await req.json();
    const { question, workspaceId, documentIds, conversationId, provider, model } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "A valid 'question' string is required." },
        { status: 400 }
      );
    }

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        { error: "A valid 'workspaceId' is required." },
        { status: 400 }
      );
    }

    // Execute RAG LangChain pipeline
    const { stream } = await executeRAGStream({
      question,
      workspaceId,
      userId,
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
    const message = error instanceof Error ? error.message : "Internal server error during chat processing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
