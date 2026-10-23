import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { processDocument } from "@/services/document-processor";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || "demo-user-id";
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

    // Insert document record in uploading state
    const { error: dbError } = await adminDb.from("documents").insert({
      id: documentId,
      workspace_id: workspaceId,
      user_id: userId,
      title: fileName,
      file_path: `documents/${workspaceId}/${documentId}/${fileName}`,
      file_type: ext.replace(".", ""),
      file_size_bytes: file.size,
      status: "uploading",
    });

    if (dbError) {
      return NextResponse.json(
        { error: `Failed to create document record: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Process document synchronously or queue
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
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to upload document." },
      { status: 500 }
    );
  }
}
