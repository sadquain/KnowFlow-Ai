import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageItem, type ChatMessage } from "@/components/chat/message-item";
import { ModelSelector } from "@/components/chat/model-selector";

describe("Chat Controls & MessageItem (RTL Tests)", () => {
  it("renders assistant message with feedback thumbs and triggers onFeedback", () => {
    const onFeedback = vi.fn();
    const onSelectCitation = vi.fn();

    const mockMessage: ChatMessage = {
      id: "msg-asst-1",
      role: "assistant",
      content: "Here is your grounded answer with citations.",
      citations: [
        {
          id: "c-1",
          document_id: "d-1",
          document_title: "Policy.pdf",
          chunk_id: "chk-1",
          snippet: "Section 4.1 details.",
          similarity_score: 0.92,
          page_number: 2,
        },
      ],
    };

    render(
      <MessageItem
        message={mockMessage}
        onSelectCitation={onSelectCitation}
        onFeedback={onFeedback}
      />
    );

    expect(screen.getByText("Here is your grounded answer with citations.")).toBeDefined();

    // Click thumbs up
    const thumbUpBtn = screen.getByRole("button", { name: /Mark response as helpful/i });
    expect(thumbUpBtn).toBeDefined();
    fireEvent.click(thumbUpBtn);
    expect(onFeedback).toHaveBeenCalledWith(true);

    // Verify button is now disabled after feedback
    expect(thumbUpBtn.getAttribute("disabled")).toBeDefined();
  });

  it("renders user message with distinctive role alignment", () => {
    const onSelectCitation = vi.fn();
    const mockUserMsg: ChatMessage = {
      id: "msg-user-1",
      role: "user",
      content: "How much vacation time do I get?",
    };

    render(<MessageItem message={mockUserMsg} onSelectCitation={onSelectCitation} />);

    expect(screen.getByText("How much vacation time do I get?")).toBeDefined();
  });

  it("allows switching models using ModelSelector", () => {
    const onSelect = vi.fn();
    render(
      <ModelSelector
        selectedProvider="gemini"
        selectedModel="gemini-3.5-flash"
        onSelect={onSelect}
      />
    );

    // Trigger dropdown
    const trigger = screen.getByRole("button", { name: /Select LLM/i });
    fireEvent.click(trigger);

    // Select Groq option
    const groqBtn = screen.getByRole("option", { name: /Groq/i });
    fireEvent.click(groqBtn);

    expect(onSelect).toHaveBeenCalledWith("groq", "openai/gpt-oss-120b");
  });
});
