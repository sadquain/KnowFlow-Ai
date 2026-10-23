import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CitationBadge } from "@/components/chat/citation-badge";
import type { GroundedCitation } from "@/lib/ai/types";

describe("CitationBadge Component (WCAG 2.2 Accessible Citations)", () => {
  const mockCitation: GroundedCitation = {
    id: "cite-1",
    document_id: "doc-123",
    document_title: "Employee_Handbook_2024.pdf",
    chunk_id: "chunk-456",
    snippet: "Employees receive 20 days of paid vacation per calendar year.",
    page_number: 14,
    similarity_score: 0.89,
  };

  it("renders citation index, document title, and page number", () => {
    const onSelect = vi.fn();
    render(<CitationBadge citation={mockCitation} index={0} onSelect={onSelect} />);

    expect(screen.getByText("[1]")).toBeDefined();
    expect(screen.getByText("Employee_Handbook_2024.pdf")).toBeDefined();
    expect(screen.getByText("p.14")).toBeDefined();
  });

  it("provides descriptive accessible aria-label for screen readers", () => {
    const onSelect = vi.fn();
    render(<CitationBadge citation={mockCitation} index={0} onSelect={onSelect} />);

    const button = screen.getByRole("button", {
      name: /View citation 1: Employee_Handbook_2024\.pdf, Page 14/i,
    });
    expect(button).toBeDefined();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(<CitationBadge citation={mockCitation} index={0} onSelect={onSelect} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockCitation);
  });
});
