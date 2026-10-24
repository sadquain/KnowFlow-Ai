import { describe, it, expect, beforeEach } from "vitest";
import { localStore } from "@/lib/storage/store";
import { getChatModel, getEmbeddingModel } from "@/lib/ai/factory";

describe("Conversation & Multi-LLM Provider Suite", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "dummy-gemini-key";
    process.env.GROQ_API_KEY = "dummy-groq-key";
  });

  it("should create and retrieve conversation sessions in store", () => {
    const conv = localStore.createConversation("ws-test-1", "user-123", "Q3 Financials Deep Dive");
    expect(conv.id).toBeDefined();
    expect(conv.title).toBe("Q3 Financials Deep Dive");

    const retrieved = localStore.getConversation(conv.id);
    expect(retrieved?.id).toBe(conv.id);

    const list = localStore.getConversations("ws-test-1");
    expect(list.some((c) => c.id === conv.id)).toBe(true);
  });

  it("should append and retrieve multi-turn messages with citations", () => {
    const conv = localStore.createConversation("ws-test-1", "user-123");
    
    localStore.addMessage({
      id: "msg-1",
      conversation_id: conv.id,
      workspace_id: "ws-test-1",
      role: "user",
      content: "What was the EBITDA margin in 2024?",
      created_at: new Date().toISOString(),
    });

    localStore.addMessage({
      id: "msg-2",
      conversation_id: conv.id,
      workspace_id: "ws-test-1",
      role: "assistant",
      content: "The EBITDA margin was 28.4% [1].",
      citations: [
        {
          id: "cite-1",
          document_id: "doc-1",
          document_title: "Financial_Report.pdf",
          chunk_id: "chk-1",
          snippet: "EBITDA margin reached 28.4%",
          similarity_score: 0.89,
        },
      ],
      created_at: new Date().toISOString(),
    });

    const messages = localStore.getMessages(conv.id);
    expect(messages.length).toBe(2);
    expect(messages[0].role).toBe("user");
    expect(messages[1].role).toBe("assistant");
    expect(messages[1].citations?.length).toBe(1);
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
