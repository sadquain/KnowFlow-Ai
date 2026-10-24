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

    // Verify user is authenticated and is a member of this workspace
    const { supabase } = await requireWorkspaceMember(workspaceId);

    // Use user-scoped client with RLS to query documents
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/documents] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data || [] });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to fetch documents.";
    console.error("[GET /api/documents] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
