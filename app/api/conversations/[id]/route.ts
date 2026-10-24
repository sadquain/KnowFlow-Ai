import { NextRequest, NextResponse } from "next/server";
import { requireConversationAccess } from "@/lib/auth/require-workspace-member";
import { AuthError } from "@/lib/auth/require-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing conversation id." }, { status: 400 });
    }

    // Verify user belongs to conversation's workspace
    const { supabase } = await requireConversationAccess(id);

    // Query messages with sources using user-scoped client
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, conversation_id, workspace_id, role, content, created_at, message_sources(*)")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[GET /api/conversations/[id]] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    interface DBMessageSource {
      document_id: string;
      chunk_id?: string;
      snippet: string;
      page_number?: number;
      similarity_score?: number;
    }

    interface DBMessage {
      id: string;
      role: "user" | "assistant";
      content: string;
      created_at: string;
      message_sources?: DBMessageSource[];
    }

    const mappedMessages = (messages as unknown as DBMessage[]).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
      citations: (m.message_sources || []).map((s, idx: number) => ({
        id: `cite-${idx + 1}`,
        document_id: s.document_id,
        document_title: "Source Document",
        chunk_id: s.chunk_id,
        snippet: s.snippet,
        page_number: s.page_number,
        similarity_score: s.similarity_score,
      })),
    }));

    return NextResponse.json({ messages: mappedMessages });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to load conversation messages.";
    console.error("[GET /api/conversations/[id]] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing conversation id." }, { status: 400 });
    }

    // Verify user belongs to conversation's workspace
    const { supabase } = await requireConversationAccess(id);

    // Delete conversation using user-scoped client (subject to RLS)
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      console.error("[DELETE /api/conversations/[id]] Deletion error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to delete conversation.";
    console.error("[DELETE /api/conversations/[id]] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
