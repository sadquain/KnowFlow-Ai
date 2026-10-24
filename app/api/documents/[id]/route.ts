import { NextRequest, NextResponse } from "next/server";
import { requireDocumentAccess } from "@/lib/auth/require-workspace-member";
import { AuthError } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || undefined;

    if (!id) {
      return NextResponse.json({ error: "Missing document id." }, { status: 400 });
    }

    // Verify caller is authenticated and has access to this document's workspace
    const { document, supabase } = await requireDocumentAccess(id, workspaceId);

    // Delete chunks associated with the document
    const adminDb = createAdminClient();
    await adminDb.from("document_chunks").delete().eq("document_id", id);

    // Delete document record using user-scoped client (subject to RLS)
    const { error: deleteError } = await supabase.from("documents").delete().eq("id", id);

    if (deleteError) {
      console.error("[DELETE /api/documents/[id]] Deletion error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Clean up Supabase Storage file
    if (document.file_path) {
      try {
        await adminDb.storage.from("documents").remove([document.file_path]);
      } catch (storageErr) {
        console.warn("[DELETE /api/documents/[id]] Storage removal warning:", storageErr);
      }
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to delete document.";
    console.error("[DELETE /api/documents/[id]] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
