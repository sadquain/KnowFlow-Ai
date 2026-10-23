import { describe, it, expect } from "vitest";
import { sanitizeQuestion } from "@/services/rag-service";
import { formatBytes } from "@/lib/utils";

describe("Validation & Sanitization Suite", () => {
  it("should accept valid question strings", () => {
    const q = "What were the Q3 operational revenues?";
    expect(sanitizeQuestion(q)).toBe(q);
  });

  it("should trim excess whitespace from user queries", () => {
    const q = "   What are our growth targets?   ";
    expect(sanitizeQuestion(q)).toBe("What are our growth targets?");
  });

  it("should throw an error for empty or whitespace-only questions", () => {
    expect(() => sanitizeQuestion("")).toThrow("Question cannot be empty.");
    expect(() => sanitizeQuestion("   ")).toThrow("Question cannot be empty.");
  });

  it("should throw an error when question exceeds 1000 characters", () => {
    const longQuestion = "a".repeat(1001);
    expect(() => sanitizeQuestion(longQuestion)).toThrow("exceeds maximum length of 1,000 characters");
  });

  it("should correctly format byte quantities into human-readable strings", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024 * 3.5)).toBe("3.5 MB");
  });
});
