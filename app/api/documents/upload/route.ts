import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { processDocument } from "@/services/document-processor";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upload documents." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId." }, { status: 400 });
    }

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

    const adminDb = createAdminClient();
    const documentId = crypto.randomUUID();
    const filePath = `${workspaceId}/${documentId}/${fileName}`;

    // Upload raw binary file to Supabase Storage bucket
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
      user_id: user.id,
      title: fileName,
      file_path: filePath,
      file_type: ext.replace(".", ""),
      file_size_bytes: file.size,
      status: "uploading" as const,
      chunk_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert document record in uploading state
    const { error: dbError } = await adminDb.from("documents").insert(newDoc);
    if (dbError) {
      return NextResponse.json(
        { error: `Failed to register document: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Process document synchronously
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
    const message = err instanceof Error ? err.message : "Failed to upload document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
