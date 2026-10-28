import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import { CitationBadge } from "@/components/chat/citation-badge";
import { DocumentStatusBadge, DocumentTypeBadge } from "@/components/documents/document-badge";

describe("Accessibility Suite (axe-core WCAG 2.2)", () => {
  it("CitationBadge should have zero critical accessibility violations", async () => {
    const { container } = render(
      <CitationBadge
        index={0}
        citation={{
          id: "cite-1",
          document_id: "doc-1",
          document_title: "Report.pdf",
          chunk_id: "chk-1",
          snippet: "Report snippet",
          page_number: 1,
          similarity_score: 0.95,
        }}
        onSelect={() => {}}
      />
    );

    const results = await axe.run(container);
    const criticalViolations = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(criticalViolations.length).toBe(0);
  });

  it("Document badges should have zero critical accessibility violations", async () => {
    const { container } = render(
      <div>
        <DocumentStatusBadge status="ready" />
        <DocumentStatusBadge status="failed" />
        <DocumentTypeBadge type="pdf" />
      </div>
    );

    const results = await axe.run(container);
    const criticalViolations = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(criticalViolations.length).toBe(0);
  });
});
