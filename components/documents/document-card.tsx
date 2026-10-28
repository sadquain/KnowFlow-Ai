"use client";

import React from "react";
import { Trash2, Calendar, FileText, Layers, Download, RefreshCw } from "lucide-react";
import { DocumentStatusBadge, DocumentTypeBadge } from "./document-badge";
import { formatBytes, formatDate } from "@/lib/utils";

export interface DocumentItem {
  id: string;
  title: string;
  file_type: string;
  file_size_bytes: number;
  status: "uploading" | "processing" | "ready" | "failed";
  chunk_count: number;
  created_at: string;
  error_message?: string;
}

interface DocumentCardProps {
  document: DocumentItem;
  onDelete: (id: string) => void;
  onRetry?: (id: string) => void;
  isDeleting?: boolean;
  isRetrying?: boolean;
}

export function DocumentCard({
  document,
  onDelete,
  onRetry,
  isDeleting,
  isRetrying,
}: DocumentCardProps) {
  return (
    <article className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <DocumentTypeBadge type={document.file_type} />
          <DocumentStatusBadge status={document.status} />
        </div>

        <div className="flex items-center gap-1">
          {document.status === "failed" && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(document.id)}
              disabled={isRetrying}
              title="Retry processing document"
              aria-label={`Retry processing document ${document.title}`}
              className="rounded-lg p-1.5 text-amber-600 transition-all hover:bg-amber-50 hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
            </button>
          )}
          <a
            href={`/api/documents/${document.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            title="Download original document or content"
            aria-label={`Download document ${document.title}`}
            className="rounded-lg p-1.5 text-slate-400 opacity-80 transition-all hover:bg-blue-50 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => onDelete(document.id)}
            disabled={isDeleting}
            aria-label={`Delete document ${document.title}`}
            className="rounded-lg p-1.5 text-slate-400 opacity-80 transition-all hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h3 className="mt-3 text-sm font-bold text-slate-900 line-clamp-1" title={document.title}>
        {document.title}
      </h3>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-slate-400" />
          <span>
            {document.chunk_count} {document.chunk_count === 1 ? "chunk" : "chunks"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          <span>{formatBytes(document.file_size_bytes)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{formatDate(document.created_at)}</span>
        </div>
      </div>

      {document.error_message && (
        <div
          className="mt-3 flex items-center justify-between rounded-lg bg-red-50 p-2 text-xs text-red-600"
          role="alert"
        >
          <span className="line-clamp-2">{document.error_message}</span>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(document.id)}
              disabled={isRetrying}
              className="ml-2 inline-flex shrink-0 items-center gap-1 font-semibold text-red-700 underline hover:text-red-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isRetrying ? "animate-spin" : ""}`} />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}
    </article>
  );
}
