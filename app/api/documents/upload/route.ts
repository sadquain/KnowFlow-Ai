import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWorkspaceMember } from "@/lib/auth/require-workspace-member";
import { AuthError } from "@/lib/auth/require-user";
import { processDocument } from "@/services/document-processor";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId." }, { status: 400 });
    }

    // Enforce workspace membership & role check (owner, admin, or member)
    const { user, supabase } = await requireWorkspaceMember(workspaceId, [
      "owner",
      "admin",
      "member",
    ]);

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the 10MB limit." },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const documentId = crypto.randomUUID();
    const filePath = `${workspaceId}/${documentId}/${fileName}`;

    // Upload raw binary file to Supabase Storage bucket via service-role admin client
    const adminDb = createAdminClient();
    const { error: storageError } = await adminDb.storage
      .from("documents")
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (storageError) {
      console.warn("[upload] Storage bucket warning:", storageError.message);
    }

    const newDoc = {
      id: documentId,
      workspace_id: workspaceId,
      user_id: user.id, // Strictly derived from session
      title: fileName,
      file_path: filePath,
      file_type: ext.replace(".", ""),
      file_size_bytes: file.size,
      status: "uploading" as const,
      chunk_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert document record using user-scoped client to satisfy RLS
    const { error: dbError } = await supabase.from("documents").insert(newDoc);
    if (dbError) {
      // If RLS fails on user-scoped client, log and report safe error
      console.error("[upload] Document insertion error:", dbError);
      return NextResponse.json(
        { error: `Failed to register document: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Process document synchronously (chunking & embeddings)
    const result = await processDocument(
      documentId,
      workspaceId,
      buffer,
      ext.replace(".", "")
    );

    return NextResponse.json({
      success: result.success,
      documentId,
      fileName,
      chunkCount: result.chunkCount,
      error: result.error,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to upload document.";
    console.error("[POST /api/documents/upload] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
