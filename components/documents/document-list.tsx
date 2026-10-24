"use client";

import React, { useState } from "react";
import { Search, Plus, FileQuestion } from "lucide-react";
import { DocumentCard, type DocumentItem } from "./document-card";

interface DocumentListProps {
  documents: DocumentItem[];
  onDelete: (id: string) => void;
  onOpenUpload: () => void;
  isLoading?: boolean;
}

export function DocumentList({
  documents,
  onDelete,
  onOpenUpload,
  isLoading,
}: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Action Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name..."
            aria-label="Search documents"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-800 placeholder-slate-400 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-slate-100 bg-slate-100/60" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && documents.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileQuestion className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">No documents yet</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Upload your first PDF, DOCX, TXT, or Markdown document to start grounding your AI queries.
          </p>
          <button
            type="button"
            onClick={onOpenUpload}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>
      )}

      {/* Filtered Out State */}
      {!isLoading && documents.length > 0 && filteredDocs.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
          No documents found matching &ldquo;{searchQuery}&rdquo;.
        </div>
      )}

      {/* Document Grid */}
      {!isLoading && filteredDocs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => (
            <DocumentCard key={doc.id} document={doc} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
