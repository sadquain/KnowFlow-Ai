import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { localStore } from "@/lib/storage/store";

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

    localStore.deleteDocument(id);

    try {
      const supabase = createAdminClient();
      let query = supabase.from("documents").delete().eq("id", id);
      if (workspaceId) {
        query = query.eq("workspace_id", workspaceId);
      }
      await query;
    } catch {
      // Local deletion already succeeded
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete document." }, { status: 500 });
  }
}
