import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { localStore } from "@/lib/storage/store";

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

    if (error || !messages) {
      // Fallback to localStore
      const fallbackMsgs = localStore.getMessages(id);
      return NextResponse.json({ messages: fallbackMsgs });
    }

    const mappedMessages = messages.map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
      citations: (m.message_sources || []).map((s: any, idx: number) => ({
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
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load conversation messages." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    await supabase.from("conversations").delete().eq("id", id);
    localStore.deleteConversation(id);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete conversation." },
      { status: 500 }
    );
  }
}
