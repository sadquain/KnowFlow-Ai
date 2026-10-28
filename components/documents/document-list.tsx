"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, FileQuestion, ArrowUpDown } from "lucide-react";
import { DocumentCard, type DocumentItem } from "./document-card";

interface DocumentListProps {
  documents: DocumentItem[];
  onDelete: (id: string) => void;
  onRetry?: (id: string) => void;
  onOpenUpload: () => void;
  isLoading?: boolean;
  isRetryingId?: string | null;
}

type StatusFilter = "all" | "ready" | "processing" | "failed";
type TypeFilter = "all" | "pdf" | "docx" | "txt" | "markdown";
type SortOption = "newest" | "oldest" | "name" | "size";

export function DocumentList({
  documents,
  onDelete,
  onRetry,
  onOpenUpload,
  isLoading,
  isRetryingId,
}: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const filteredAndSortedDocs = useMemo(() => {
    return documents
      .filter((doc) => {
        // Name search
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        // Status filter
        if (statusFilter !== "all" && doc.status !== statusFilter) return false;

        // Type filter
        if (typeFilter !== "all") {
          const docType = doc.file_type.toLowerCase();
          if (typeFilter === "pdf" && !docType.includes("pdf")) return false;
          if (typeFilter === "docx" && !docType.includes("word") && !docType.includes("docx"))
            return false;
          if (typeFilter === "txt" && !docType.includes("plain") && !docType.includes("txt"))
            return false;
          if (typeFilter === "markdown" && !docType.includes("markdown") && !docType.includes("md"))
            return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === "name") {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === "size") {
          return (b.file_size_bytes || 0) - (a.file_size_bytes || 0);
        }
        return 0;
      });
  }, [documents, searchQuery, statusFilter, typeFilter, sortBy]);

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
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter and Sort Pills Toolbar */}
      {documents.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 uppercase tracking-wider">
              Status:
            </span>
            {(["all", "ready", "processing", "failed"] as StatusFilter[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition ${
                  statusFilter === st
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* File Type Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 uppercase tracking-wider">
                Type:
              </span>
              {(["all", "pdf", "docx", "txt", "markdown"] as TypeFilter[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTypeFilter(tf)}
                  className={`rounded-lg px-2 py-0.5 text-xs font-medium uppercase transition ${
                    typeFilter === tf
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="size">File Size</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-slate-100 bg-slate-100/60"
            />
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
      {!isLoading && documents.length > 0 && filteredAndSortedDocs.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
          No documents found matching the selected filter criteria.
        </div>
      )}

      {/* Document Grid */}
      {!isLoading && filteredAndSortedDocs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={onDelete}
              onRetry={onRetry}
              isRetrying={isRetryingId === doc.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
