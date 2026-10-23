import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!id) {
      return NextResponse.json({ error: "Missing document id." }, { status: 400 });
    }

    const supabase = createAdminClient();
    let query = supabase.from("documents").delete().eq("id", id);
    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete document." }, { status: 500 });
  }
}
