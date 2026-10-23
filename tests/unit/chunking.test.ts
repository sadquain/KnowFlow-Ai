import { describe, it, expect } from "vitest";
import { normalizeText } from "@/services/document-processor";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

describe("Text Normalization and Chunking Suite", () => {
  it("should strip non-printable ASCII control characters", () => {
    const dirty = "Hello\x00 World\x07! This is a \x1Btest.";
    const clean = normalizeText(dirty);
    expect(clean).toBe("Hello World! This is a test.");
  });

  it("should normalize Windows CRLF and CR linebreaks to LF", () => {
    const raw = "Paragraph 1\r\n\r\nParagraph 2\rParagraph 3";
    const normalized = normalizeText(raw);
    expect(normalized).toBe("Paragraph 1\n\nParagraph 2\nParagraph 3");
  });

  it("should split long text into bounded chunks with overlap using RecursiveCharacterTextSplitter", async () => {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 100,
      chunkOverlap: 20,
      separators: ["\n\n", "\n", " ", ""],
    });

    const sampleText =
      "KnowFlow AI is a high-performance RAG platform built on Next.js and pgvector. " +
      "It allows teams to index documentation and query it using LangChain.js runnables. " +
      "Every generated token is streamed in real time to the browser with verifiable citation attribution.";

    const chunks = await splitter.createDocuments([sampleText]);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.pageContent.length).toBeLessThanOrEqual(100);
    }
  });
});
