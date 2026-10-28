import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/require-workspace-member";
import { AuthError } from "@/lib/auth/require-user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, messageId, isPositive, comment } = body;

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json({ error: "Missing or invalid workspaceId." }, { status: 400 });
    }

    if (!messageId || typeof messageId !== "string") {
      return NextResponse.json({ error: "Missing or invalid messageId." }, { status: 400 });
    }

    if (typeof isPositive !== "boolean") {
      return NextResponse.json(
        { error: "Field 'isPositive' must be a boolean." },
        { status: 400 }
      );
    }

    // 1. Verify caller has access to the workspace
    const { user, supabase } = await requireWorkspaceMember(workspaceId);

    // 2. Verify that the target message exists and belongs to this workspace
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("id, workspace_id")
      .eq("id", messageId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (messageError || !message) {
      return NextResponse.json(
        { error: "Target message not found within this workspace." },
        { status: 404 }
      );
    }

    // 3. Upsert feedback record (one per user per message)
    const { data: feedback, error: feedbackError } = await supabase
      .from("feedback")
      .upsert(
        {
          workspace_id: workspaceId,
          message_id: messageId,
          user_id: user.id,
          is_positive: isPositive,
          comment: typeof comment === "string" ? comment.trim() : null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "message_id,user_id" }
      )
      .select()
      .single();

    if (feedbackError) {
      console.error("[POST /api/feedback] Database error:", feedbackError);
      return NextResponse.json({ error: feedbackError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedback }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to record message feedback.";
    console.error("[POST /api/feedback] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const messageId = searchParams.get("messageId");

    if (!workspaceId || !messageId) {
      return NextResponse.json(
        { error: "Both workspaceId and messageId are required." },
        { status: 400 }
      );
    }

    const { user, supabase } = await requireWorkspaceMember(workspaceId);

    const { data: feedback, error } = await supabase
      .from("feedback")
      .select("id, is_positive, comment, created_at")
      .eq("workspace_id", workspaceId)
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/feedback] Error querying feedback:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: feedback || null });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to query feedback.";
    console.error("[GET /api/feedback] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
