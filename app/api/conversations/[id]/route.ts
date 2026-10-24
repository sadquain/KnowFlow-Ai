import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Query messages with sources
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, conversation_id, workspace_id, role, content, created_at, message_sources(*)")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
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
    const message = err instanceof Error ? err.message : "Failed to load conversation messages.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Delete associated message_sources, messages, and conversation
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete conversation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
