"use client";

import React from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import type { GroundedCitation } from "@/lib/ai/types";

interface CitationBadgeProps {
  citation: GroundedCitation;
  index: number;
  onSelect: (citation: GroundedCitation) => void;
}

export function CitationBadge({ citation, index, onSelect }: CitationBadgeProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(citation)}
      aria-label={`View citation ${index + 1}: ${citation.document_title}${
        citation.page_number ? `, Page ${citation.page_number}` : ""
      }`}
      className="group inline-flex items-center gap-1.5 rounded-lg border border-blue-200/90 bg-blue-50/70 px-2.5 py-1 text-xs font-medium text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-100 hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <BookOpen className="h-3 w-3 text-blue-600" aria-hidden="true" />
      <span className="font-semibold">[{index + 1}]</span>
      <span className="max-w-[120px] truncate">{citation.document_title}</span>
      {citation.page_number && (
        <span className="text-[10px] text-blue-500">p.{citation.page_number}</span>
      )}
      <ExternalLink className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" aria-hidden="true" />
    </button>
  );
}
