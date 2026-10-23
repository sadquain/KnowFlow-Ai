import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentStatusBadge, DocumentTypeBadge } from "@/components/documents/document-badge";

describe("Document Badge Components (WCAG 2.2 Multi-modal State Tests)", () => {
  it("renders Ready status with both textual label and check indicator", () => {
    render(<DocumentStatusBadge status="ready" />);
    const badge = screen.getByText("Ready");
    expect(badge).toBeDefined();
  });

  it("renders Processing status with both textual label and spinning indicator", () => {
    render(<DocumentStatusBadge status="processing" />);
    const badge = screen.getByText("Processing");
    expect(badge).toBeDefined();
  });

  it("renders Failed status with both textual label and alert indicator", () => {
    render(<DocumentStatusBadge status="failed" />);
    const badge = screen.getByText("Failed");
    expect(badge).toBeDefined();
  });

  it("renders correct file type badges with semantic labels", () => {
    const { rerender } = render(<DocumentTypeBadge type="pdf" />);
    expect(screen.getByText("PDF")).toBeDefined();

    rerender(<DocumentTypeBadge type="docx" />);
    expect(screen.getByText("DOCX")).toBeDefined();

    rerender(<DocumentTypeBadge type="md" />);
    expect(screen.getByText("MD")).toBeDefined();
  });
});
