"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, BookOpen, Layers, CheckCircle2 } from "lucide-react";
import type { GroundedCitation } from "@/lib/ai/types";

interface CitationPreviewDrawerProps {
  citation: GroundedCitation | null;
  onClose: () => void;
}

export function CitationPreviewDrawer({ citation, onClose }: CitationPreviewDrawerProps) {
  if (!citation) return null;

  return (
    <Dialog.Root open={!!citation} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs transition-opacity" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none sm:p-7"
          aria-describedby="citation-body"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <Dialog.Title className="text-sm font-bold text-slate-900 truncate max-w-[280px]">
                  {citation.document_title}
                </Dialog.Title>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  {citation.page_number && <span>Page {citation.page_number}</span>}
                  <span>·</span>
                  <span className="text-emerald-600 font-medium">
                    {Math.round(citation.similarity_score * 100)}% Match
                  </span>
                </div>
              </div>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close citation details"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Verbatim Grounded Snippet */}
          <div className="mt-4">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Verbatim Source Passage
            </span>
            <div
              id="citation-body"
              className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-mono"
            >
              {citation.snippet}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Grounded in pgvector chunk</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200"
            >
              Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
