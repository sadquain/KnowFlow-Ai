import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { localStore } from "@/lib/storage/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const adminDb = createAdminClient();

    // 1. Fetch document metadata
    const { data: doc } = await adminDb.from("documents").select("*").eq("id", id).maybeSingle();
    const docData = doc || localStore.getDocuments("default-ws").find((d) => d.id === id);

    if (!docData) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // 2. Try fetching from Supabase Storage
    if (docData.file_path) {
      const { data: fileBlob, error: downloadError } = await adminDb.storage
        .from("documents")
        .download(docData.file_path);

      if (!downloadError && fileBlob) {
        const buffer = await fileBlob.arrayBuffer();
        return new Response(buffer, {
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(docData.title)}"`,
          },
        });
      }
    }

    // 3. Fallback: Assemble document content from stored chunks
    const { data: chunks } = await adminDb
      .from("document_chunks")
      .select("content, chunk_index")
      .eq("document_id", id)
      .order("chunk_index", { ascending: true });

    let fullText = "";
    if (chunks && chunks.length > 0) {
      fullText = chunks.map((c) => c.content).join("\n\n");
    } else {
      fullText = `Preview for ${docData.title}\n\nDocument status: ${docData.status}\nSize: ${docData.file_size_bytes} bytes`;
    }

    return new Response(fullText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(docData.title)}.txt"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to download document." },
      { status: 500 }
    );
  }
}
