"use client";

import React, { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { UploadCloud, X, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onUploadSuccess: () => void;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  workspaceId,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = e.dataTransfer.files[0];
      validateAndSetFile(selected);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    const valid = [".pdf", ".docx", ".txt", ".md"];
    if (!valid.includes(ext)) {
      setError(`Unsupported file type. Please upload PDF, DOCX, TXT, or Markdown.`);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum 10MB limit.");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", workspaceId);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process document.");
      }

      setSuccessMsg(`Document processed successfully into ${data.chunkCount} vector chunks!`);
      setFile(null);
      onUploadSuccess();
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to upload document.";
      setError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none sm:p-7"
          aria-describedby="upload-description"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <Dialog.Title className="text-lg font-bold text-slate-900">
                Upload Document
              </Dialog.Title>
              <Dialog.Description id="upload-description" className="text-xs text-slate-500">
                Add PDF, DOCX, TXT, or Markdown files to your knowledge base.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all ${
              isDragOver
                ? "border-blue-500 bg-blue-50/60"
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              className="sr-only"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              Click to select or drag and drop
            </p>
            <p className="mt-1 text-xs text-slate-400">
              PDF, Word DOCX, TXT, or Markdown (Max 10MB)
            </p>
          </div>

          {/* Selected File Card */}
          {file && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-3">
              <div className="flex items-center gap-3 truncate">
                <FileText className="h-5 w-5 shrink-0 text-blue-600" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                  <p className="text-[11px] text-slate-500">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              role="alert"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div
              className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"
              role="status"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-95 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing & Indexing...</span>
                </>
              ) : (
                <span>Upload & Index</span>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
