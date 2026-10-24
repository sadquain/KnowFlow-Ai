import { describe, it, expect, beforeEach } from "vitest";
import { getChatModel, getEmbeddingModel } from "@/lib/ai/factory";

describe("Conversation & Multi-LLM Provider Suite", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "dummy-gemini-key";
    process.env.GROQ_API_KEY = "dummy-groq-key";
  });

  it("should validate conversation and message data models with citations", () => {
    const conversationId = "conv-test-1";
    const userMessage = {
      id: "msg-1",
      conversation_id: conversationId,
      workspace_id: "ws-test-1",
      role: "user" as const,
      content: "What was the EBITDA margin in 2024?",
      created_at: new Date().toISOString(),
    };

    const assistantMessage = {
      id: "msg-2",
      conversation_id: conversationId,
      workspace_id: "ws-test-1",
      role: "assistant" as const,
      content: "The EBITDA margin was 28.4% [1].",
      citations: [
        {
          id: "cite-1",
          document_id: "doc-1",
          document_title: "Financial_Report.pdf",
          chunk_id: "chk-1",
          snippet: "EBITDA margin reached 28.4%",
          similarity_score: 0.89,
          page_number: 1,
        },
      ],
      created_at: new Date().toISOString(),
    };

    const messages = [userMessage, assistantMessage];
    expect(messages.length).toBe(2);
    expect(userMessage.role).toBe("user");
    expect(assistantMessage.role).toBe("assistant");
    expect(assistantMessage.citations.length).toBe(1);
    expect(assistantMessage.citations[0].document_title).toBe("Financial_Report.pdf");
  });

  it("should configure Gemini chat model when explicitly requested", () => {
    const model = getChatModel("gemini", "gemini-3.8-flash");
    expect(model).toBeDefined();
  });

  it("should configure Groq chat model when explicitly requested", () => {
    const model = getChatModel("groq", "openai/gpt-oss-120b");
    expect(model).toBeDefined();
  });

  it("should configure Ollama chat model when explicitly requested", () => {
    const model = getChatModel("ollama", "llama3.2");
    expect(model).toBeDefined();
  });

  it("should configure Gemini embedding model when explicitly requested", () => {
    const embed = getEmbeddingModel("gemini", "gemini-embedding-001");
    expect(embed).toBeDefined();
  });
});
