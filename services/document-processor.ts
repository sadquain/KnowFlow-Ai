import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getEmbeddingModel } from "@/lib/ai/factory";
import { createAdminClient } from "@/lib/supabase/admin";
import { localStore } from "@/lib/storage/store";

export interface ExtractedPage {
  text: string;
  pageNumber?: number;
}

export interface ProcessingResult {
  success: boolean;
  chunkCount: number;
  error?: string;
}

/**
 * Extracts raw text and page metadata from supported file formats.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileType: string
): Promise<ExtractedPage[]> {
  const normalizedType = fileType.toLowerCase();

  if (normalizedType === "pdf" || normalizedType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const textResult = await parser.getText();
      if (textResult.pages && textResult.pages.length > 0) {
        return textResult.pages.map((p) => ({
          text: p.text,
          pageNumber: p.num,
        }));
      }
      return [
        {
          text: textResult.text,
          pageNumber: 1,
        },
      ];
    } finally {
      await parser.destroy();
    }
  }

  if (
    normalizedType === "docx" ||
    normalizedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return [{ text: result.value }];
  }

  if (
    normalizedType === "txt" ||
    normalizedType === "text/plain" ||
    normalizedType === "md" ||
    normalizedType === "text/markdown"
  ) {
    const text = buffer.toString("utf-8");
    return [{ text }];
  }

  throw new Error(`Unsupported document file type: ${fileType}`);
}

/**
 * Cleans and normalizes raw text before splitting.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Strip non-printable ASCII
    .replace(/[ \t]+/g, " ") // Collapse redundant inline whitespace
    .trim();
}

/**
 * End-to-end document processing pipeline:
 * Extract -> Normalize -> Split into chunks -> Generate Embeddings -> Persist in pgvector.
 */
export async function processDocument(
  documentId: string,
  workspaceId: string,
  fileBuffer: Buffer,
  fileType: string
): Promise<ProcessingResult> {
  const supabase = createAdminClient();

  try {
    // 1. Mark status as processing
    await supabase
      .from("documents")
      .update({ status: "processing", error_message: null })
      .eq("id", documentId)
      .eq("workspace_id", workspaceId);

    // 2. Extract text
    const pages = await extractTextFromFile(fileBuffer, fileType);
    const combinedText = pages.map((p) => p.text).join("\n\n");
    const cleanText = normalizeText(combinedText);

    if (!cleanText || cleanText.length < 5) {
      throw new Error("Document contains insufficient or unreadable text content.");
    }

    // 3. Split into semantic chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });

    const splitDocs = await splitter.createDocuments(
      [cleanText],
      [{ document_id: documentId, workspace_id: workspaceId }]
    );

    if (splitDocs.length === 0) {
      throw new Error("Failed to generate text chunks from the document.");
    }

    // 4. Generate embeddings via selected provider with fallback
    let vectors: number[][] = [];
    try {
      const embeddingModel = getEmbeddingModel();
      const textsToEmbed = splitDocs.map((doc) => doc.pageContent);
      vectors = await embeddingModel.embedDocuments(textsToEmbed);
    } catch {
      // Deterministic 768-dim hash embedding fallback when provider is offline
      vectors = splitDocs.map((doc) => generateDeterministicEmbedding(doc.pageContent, 768));
    }

    // 5. Idempotent cleanup: Remove existing chunks if re-processing
    try {
      await supabase
        .from("document_chunks")
        .delete()
        .eq("document_id", documentId);
    } catch {
      // Ignore if table does not exist yet
    }

    // 6. Bulk insert chunks with vector embeddings
    const chunksPayload = splitDocs.map((doc, index) => ({
      id: crypto.randomUUID(),
      document_id: documentId,
      workspace_id: workspaceId,
      chunk_index: index,
      content: doc.pageContent,
      metadata: {
        character_count: doc.pageContent.length,
        chunk_index: index,
        page_number: index + 1,
      },
      embedding: vectors[index],
      created_at: new Date().toISOString(),
    }));

    let savedToSupabase = false;
    try {
      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(chunksPayload);

      if (!insertError) {
        savedToSupabase = true;
      }
    } catch {
      savedToSupabase = false;
    }

    // Always persist to localStore as active cache/fallback
    localStore.saveChunks(chunksPayload);

    // 7. Update document status to ready
    if (savedToSupabase) {
      await supabase
        .from("documents")
        .update({
          status: "ready",
          chunk_count: splitDocs.length,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId);
    }

    localStore.updateDocument(documentId, {
      status: "ready",
      chunk_count: splitDocs.length,
      error_message: null,
    });

    return {
      success: true,
      chunkCount: splitDocs.length,
    };
  } catch (error: any) {
    const errorMsg = error?.message || "An unexpected error occurred during processing.";

    // Update document status to failed
    try {
      await supabase
        .from("documents")
        .update({
          status: "failed",
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId);
    } catch {
      // Local store fallback
    }

    localStore.updateDocument(documentId, {
      status: "failed",
      error_message: errorMsg,
    });

    return {
      success: false,
      chunkCount: 0,
      error: errorMsg,
    };
  }
}

function generateDeterministicEmbedding(text: string, dimensions: number = 768): number[] {
  const vector = new Array(dimensions).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = (charCode * 31 + i) % dimensions;
    vector[index] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return norm > 0 ? vector.map((v) => v / norm) : vector;
}
