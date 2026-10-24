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

    // 1. Fetch document to get file_path for storage cleanup
    const { data: doc } = await supabase
      .from("documents")
      .select("file_path, workspace_id")
      .eq("id", id)
      .maybeSingle();

    if (workspaceId && doc && doc.workspace_id !== workspaceId) {
      return NextResponse.json({ error: "Document not found in workspace." }, { status: 404 });
    }

    // 2. Delete chunks first (or cascade)
    await supabase.from("document_chunks").delete().eq("document_id", id);

    // 3. Delete document record
    let query = supabase.from("documents").delete().eq("id", id);
    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    }
    const { error: deleteError } = await query;

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 4. Clean up storage if file_path exists
    if (doc?.file_path) {
      try {
        await supabase.storage.from("documents").remove([doc.file_path]);
      } catch (storageErr) {
        console.warn("[documents/[id]] Storage removal notice:", storageErr);
      }
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
