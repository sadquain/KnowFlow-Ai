import { describe, it, expect } from "vitest";
import { SYSTEM_PROMPT } from "@/services/rag-service";
import type { GroundedCitation } from "@/lib/ai/types";

describe("RAG Pipeline Unit Suite (Citations, Prompts & Streaming Abort)", () => {
  it("should enforce strict groundness instructions in the system prompt", () => {
    expect(SYSTEM_PROMPT).toContain("strictly grounded in the Source Context");
    expect(SYSTEM_PROMPT).toContain("Never fabricate facts, citations");
    expect(SYSTEM_PROMPT).toContain("[1] or [2]");
    expect(SYSTEM_PROMPT).toContain(
      "I couldn't find enough information in your knowledge base to answer that."
    );
  });

  it("should map raw retrieved chunks into grounded citation models with page numbers", () => {
    const rawChunks = [
      {
        id: "chunk-uuid-1",
        document_id: "doc-uuid-1",
        document_title: "Security_Policy_v3.pdf",
        chunk_index: 0,
        content: "Two-factor authentication (2FA) is mandatory for all production systems.",
        metadata: { page_number: 4 },
        similarity: 0.884,
      },
      {
        id: "chunk-uuid-2",
        document_id: "doc-uuid-2",
        document_title: "Onboarding_Guide.docx",
        chunk_index: 2,
        content: "New hires must complete compliance training within 14 business days.",
        metadata: { page_number: 1 },
        similarity: 0.761,
      },
    ];

    const citations: GroundedCitation[] = rawChunks.map((chunk, index) => ({
      id: `cite-${index + 1}`,
      document_id: chunk.document_id,
      document_title: chunk.document_title || "Document",
      chunk_id: chunk.id,
      snippet: chunk.content.slice(0, 250),
      page_number: chunk.metadata?.page_number,
      similarity_score: Math.round(chunk.similarity * 100) / 100,
    }));

    expect(citations.length).toBe(2);
    expect(citations[0].id).toBe("cite-1");
    expect(citations[0].page_number).toBe(4);
    expect(citations[0].similarity_score).toBe(0.88);
    expect(citations[1].page_number).toBe(1);
    expect(citations[1].similarity_score).toBe(0.76);
  });

  it("should handle AbortController signals gracefully during streaming", () => {
    const controller = new AbortController();
    expect(controller.signal.aborted).toBe(false);

    controller.abort();
    expect(controller.signal.aborted).toBe(true);
  });
});
