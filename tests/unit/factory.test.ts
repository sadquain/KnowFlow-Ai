import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getProviderConfig, getChatModel } from "@/lib/ai/factory";

describe("AI Provider Factory & Configuration Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should default to Ollama provider when env is unset", () => {
    delete process.env.AI_PROVIDER;
    delete process.env.EMBEDDING_PROVIDER;
    const config = getProviderConfig();
    expect(config.aiProvider).toBe("ollama");
    expect(config.embeddingProvider).toBe("ollama");
    expect(config.ollamaBaseUrl).toBe("http://localhost:11434");
  });

  it("should throw a descriptive error when Gemini is requested without GEMINI_API_KEY", () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => getChatModel("gemini")).toThrow("GEMINI_API_KEY is not configured in environment variables.");
  });

  it("should throw a descriptive error when Groq is requested without GROQ_API_KEY", () => {
    delete process.env.GROQ_API_KEY;
    expect(() => getChatModel("groq")).toThrow("GROQ_API_KEY is not configured in environment variables.");
  });
});
