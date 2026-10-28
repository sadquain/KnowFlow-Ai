import React from "react";
import { CheckCircle2, Clock, AlertTriangle, FileCode, FileText, File } from "lucide-react";

interface DocumentStatusBadgeProps {
  status: "uploading" | "processing" | "ready" | "failed";
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  switch (status) {
    case "ready":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>Ready</span>
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-700">
          <Clock className="h-3.5 w-3.5 text-cyan-600 animate-spin" aria-hidden="true" />
          <span>Processing</span>
        </span>
      );
    case "uploading":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
          <span>Uploading</span>
        </span>
      );
    case "failed":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
          <span>Failed</span>
        </span>
      );
  }
}

interface DocumentTypeBadgeProps {
  type: string;
}

export function DocumentTypeBadge({ type }: DocumentTypeBadgeProps) {
  const norm = (type || "").toLowerCase().replace(".", "");

  switch (norm) {
    case "pdf":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
          <FileText className="h-3 w-3 text-red-600" />
          <span>PDF</span>
        </span>
      );
    case "docx":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
          <File className="h-3 w-3 text-blue-600" />
          <span>DOCX</span>
        </span>
      );
    case "md":
    case "markdown":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
          <FileCode className="h-3 w-3 text-violet-600" />
          <span>MD</span>
        </span>
      );
    case "txt":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
          <FileText className="h-3 w-3 text-cyan-600" />
          <span>TXT</span>
        </span>
      );
  }
}
