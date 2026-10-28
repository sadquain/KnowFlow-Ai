import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/require-workspace-member";
import { AuthError } from "@/lib/auth/require-user";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId parameter is required." }, { status: 400 });
    }

    // Verify authenticated user is a member of the workspace
    const { supabase } = await requireWorkspaceMember(workspaceId);

    // Query conversations using user-scoped client so RLS applies
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[GET /api/conversations] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversations: data || [] });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to fetch conversations.";
    console.error("[GET /api/conversations] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, title } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    // Verify authenticated user is a member of the workspace
    const { user, supabase } = await requireWorkspaceMember(workspaceId);

    const convTitle =
      title && typeof title === "string" && title.trim().length > 0
        ? title.trim()
        : "New Conversation";

    // Insert conversation using user-scoped client (subject to RLS)
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id, // Strictly derived from auth session
        title: convTitle,
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/conversations] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversation: data }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to create conversation.";
    console.error("[POST /api/conversations] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
