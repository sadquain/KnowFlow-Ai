import mammoth from "mammoth";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getEmbeddingModel, getProviderConfig } from "@/lib/ai/factory";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ExtractedPage {
  text: string;
  pageNumber?: number;
}

export interface ProcessingResult {
  success: boolean;
  chunkCount: number;
  error?: string;
}

export function normalizeText(text: string): string {
  return (
    text
      // Replace non-printable ASCII control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Normalize line breaks to standard LF
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
  );
}

export async function extractTextFromFile(
  buffer: Buffer,
  fileType: string
): Promise<ExtractedPage[]> {
  const normalizedType = fileType.toLowerCase();

  if (normalizedType === "pdf" || normalizedType === "application/pdf") {
    // Pure Node.js PDF extraction with zero web-worker dependencies
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const pages: ExtractedPage[] = [];
    let pageCounter = 1;

    interface PDFTextItem {
      str: string;
    }
    interface PDFTextContent {
      items: PDFTextItem[];
    }
    interface PDFPageData {
      getTextContent: () => Promise<PDFTextContent>;
    }

    const data = await pdfParse(buffer, {
      pagerender: (pageData: PDFPageData) => {
        return pageData.getTextContent().then((textContent: PDFTextContent) => {
          const text = textContent.items.map((i: PDFTextItem) => i.str).join(" ");
          if (text.trim().length > 0) {
            pages.push({ pageNumber: pageCounter++, text: text.trim() });
          }
          return text;
        });
      },
    });

    if (pages.length === 0 && data.text) {
      pages.push({ pageNumber: 1, text: data.text.trim() });
    }

    return pages;
  }

  if (
    normalizedType === "docx" ||
    normalizedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return [{ pageNumber: 1, text: result.value.trim() }];
  }

  if (
    normalizedType === "txt" ||
    normalizedType === "text/plain" ||
    normalizedType === "md" ||
    normalizedType === "text/markdown"
  ) {
    const text = buffer.toString("utf-8").trim();
    return [{ pageNumber: 1, text }];
  }

  throw new Error(
    `Unsupported document file format: "${fileType}". Supported formats: PDF, DOCX, TXT, MD.`
  );
}

export async function processDocument(
  documentId: string,
  workspaceId: string,
  fileBuffer: Buffer,
  fileType: string
): Promise<ProcessingResult> {
  const supabase = createAdminClient();

  try {
    // 1. Transition document to processing status
    const { error: statusUpdateError } = await supabase
      .from("documents")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (statusUpdateError) {
      throw new Error(
        `Failed to update document status to processing: ${statusUpdateError.message}`
      );
    }

    // 2. Extract text from file buffer
    const pages = await extractTextFromFile(fileBuffer, fileType);
    if (!pages || pages.length === 0 || pages.every((p) => !p.text)) {
      throw new Error("No readable text could be extracted from this document.");
    }

    // 3. Chunk text using LangChain recursive text splitter
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 150,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });

    const documentsToSplit = pages
      .map((p) => ({
        pageContent: normalizeText(p.text),
        metadata: { pageNumber: p.pageNumber || 1 },
      }))
      .filter((p) => p.pageContent.trim().length > 0);

    const splitDocs = await splitter.splitDocuments(documentsToSplit);
    if (splitDocs.length === 0) {
      throw new Error("Document text was empty after processing chunks.");
    }

    // 4. Generate real vector embeddings via active embedding provider (no silent mock/hash fallbacks)
    const embeddingModel = getEmbeddingModel();
    const textsToEmbed = splitDocs.map((doc) => doc.pageContent);
    const vectors = await embeddingModel.embedDocuments(textsToEmbed);

    if (!vectors || vectors.length !== splitDocs.length) {
      throw new Error(
        `Embedding generation returned an invalid vector count: expected ${splitDocs.length}, received ${vectors?.length ?? 0}`
      );
    }

    // 5. Idempotent cleanup: Delete existing chunks before inserting new ones
    const { error: deleteError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);

    if (deleteError) {
      throw new Error(`Failed to clean up existing chunks: ${deleteError.message}`);
    }

    // 6. Bulk insert chunks with vector embeddings and model name stored in metadata JSONB
    const config = getProviderConfig();
    const chunksPayload = splitDocs.map((doc, index) => ({
      id: crypto.randomUUID(),
      document_id: documentId,
      workspace_id: workspaceId,
      chunk_index: index,
      content: doc.pageContent,
      metadata: {
        character_count: doc.pageContent.length,
        chunk_index: index,
        page_number: (doc.metadata?.pageNumber as number) || 1,
        embedding_model: config.embedModelName,
      },
      embedding: vectors[index],
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from("document_chunks").insert(chunksPayload);

    if (insertError) {
      throw new Error(`Failed to insert document chunks into database: ${insertError.message}`);
    }

    // 7. Update document status to ready
    const { error: readyError } = await supabase
      .from("documents")
      .update({
        status: "ready",
        chunk_count: splitDocs.length,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (readyError) {
      throw new Error(`Failed to update document status to ready: ${readyError.message}`);
    }

    return {
      success: true,
      chunkCount: splitDocs.length,
    };
  } catch (error: unknown) {
    let errorMsg =
      error instanceof Error ? error.message : "An unexpected error occurred during processing.";
    if (
      errorMsg.includes("fetch failed") ||
      errorMsg.includes("ECONNREFUSED") ||
      errorMsg.includes("11434")
    ) {
      errorMsg =
        "Embedding generation failed: Unable to connect to embedding service. If using Ollama, ensure it is running at http://localhost:11434, or set EMBEDDING_PROVIDER=gemini in .env.local.";
    }

    // Ensure document is explicitly marked failed in database with the exact error
    try {
      await supabase
        .from("documents")
        .update({
          status: "failed",
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId);
    } catch (dbErr) {
      console.error("[document-processor] Could not persist failure state to DB:", dbErr);
    }

    return {
      success: false,
      chunkCount: 0,
      error: errorMsg,
    };
  }
}
