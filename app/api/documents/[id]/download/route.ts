import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const adminDb = createAdminClient();

    // 1. Fetch document metadata from database
    const { data: doc, error: docError } = await adminDb
      .from("documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // 2. Fetch from Supabase Storage
    if (doc.file_path) {
      const { data: fileBlob, error: downloadError } = await adminDb.storage
        .from("documents")
        .download(doc.file_path);

      if (!downloadError && fileBlob) {
        const buffer = await fileBlob.arrayBuffer();
        return new Response(buffer, {
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.title)}"`,
          },
        });
      }
    }

    // 3. Fallback: Assemble document text from stored chunks
    const { data: chunks } = await adminDb
      .from("document_chunks")
      .select("content, chunk_index")
      .eq("document_id", id)
      .order("chunk_index", { ascending: true });

    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: "Document file content is not available." },
        { status: 404 }
      );
    }

    const fullText = chunks.map((c) => c.content).join("\n\n");

    return new Response(fullText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.title)}.txt"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to download document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
