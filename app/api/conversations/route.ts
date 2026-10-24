import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/storage/store";
import { DEMO_USER_ID } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId parameter is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ conversations: localStore.getConversations(workspaceId) });
    }

    return NextResponse.json({ conversations: data });
  } catch {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || "default-ws";
    return NextResponse.json({ conversations: localStore.getConversations(workspaceId) });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    const userId = user?.id || DEMO_USER_ID;
    const body = await req.json();
    const { workspaceId, title } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    const convTitle = title || "New Conversation";
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        title: convTitle,
      })
      .select()
      .single();

    if (error) {
      const fallbackConv = localStore.createConversation(workspaceId, userId, convTitle);
      return NextResponse.json({ conversation: fallbackConv }, { status: 201 });
    }

    return NextResponse.json({ conversation: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create conversation." }, { status: 500 });
  }
}
