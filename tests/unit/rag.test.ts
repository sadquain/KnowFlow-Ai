import { describe, it, expect } from "vitest";
import { sanitizeQuestion } from "@/services/rag-service";

describe("RAG Question Sanitization & Safety Suite", () => {
  it("should accept and trim clean user queries", () => {
    const input = "   What are the terms of the master service agreement?   ";
    const sanitized = sanitizeQuestion(input);
    expect(sanitized).toBe("What are the terms of the master service agreement?");
  });

  it("should throw an error on empty or whitespace-only queries", () => {
    expect(() => sanitizeQuestion("")).toThrow("Question cannot be empty.");
    expect(() => sanitizeQuestion("    \n\t  ")).toThrow("Question cannot be empty.");
  });

  it("should throw an error when question exceeds 1000 characters", () => {
    const longQuestion = "a".repeat(1001);
    expect(() => sanitizeQuestion(longQuestion)).toThrow(
      "Question exceeds maximum length of 1,000 characters."
    );
  });

  it("should preserve special characters and unicode within query boundaries", () => {
    const unicodeQuery = "What is the policy regarding € / $ conversion & 401(k) matches?";
    const sanitized = sanitizeQuestion(unicodeQuery);
    expect(sanitized).toBe(unicodeQuery);
  });
});
