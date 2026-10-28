import { NextRequest, NextResponse } from "next/server";
import { requireDocumentAccess } from "@/lib/auth/require-workspace-member";
import { AuthError } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { processDocument } from "@/services/document-processor";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || undefined;

    if (!id) {
      return NextResponse.json({ error: "Missing document id." }, { status: 400 });
    }

    // Verify authenticated user has access to this document
    const { document } = await requireDocumentAccess(id, workspaceId);

    if (!document.file_path) {
      return NextResponse.json(
        { error: "Document does not have an associated file path in storage." },
        { status: 400 }
      );
    }

    // Download original raw file from Supabase Storage
    const adminDb = createAdminClient();
    const { data: fileBlob, error: downloadError } = await adminDb.storage
      .from("documents")
      .download(document.file_path);

    if (downloadError || !fileBlob) {
      return NextResponse.json(
        {
          error: `Failed to download file from storage: ${downloadError?.message || "File not found"}`,
        },
        { status: 404 }
      );
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Re-process document (extract text, clean, chunk, embed, store in pgvector)
    const result = await processDocument(
      document.id,
      document.workspace_id,
      buffer,
      document.file_type || "pdf"
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          documentId: id,
          error: result.error || "Document re-processing failed.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documentId: id,
      chunkCount: result.chunkCount,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to retry document processing.";
    console.error("[POST /api/documents/[id]/retry] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
