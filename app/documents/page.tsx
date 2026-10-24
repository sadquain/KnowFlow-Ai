"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUploadModal } from "@/components/documents/document-upload-modal";
import { FileText } from "lucide-react";
import type { DocumentItem } from "@/components/documents/document-card";

export default function DocumentsPage() {
  const [workspaceId] = useState("default-ws");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    let ignore = false;
    async function loadDocs() {
      try {
        const res = await fetch(`/api/documents?workspaceId=${workspaceId}`);
        if (res.ok && !ignore) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch {
        // Handled
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    loadDocs();
    return () => {
      ignore = true;
    };
  }, [workspaceId]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}?workspaceId=${workspaceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch {
      // Handled
    }
  };

  return (
    <AppShell workspaceId={workspaceId}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <FileText className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Document Management
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Upload, inspect, and manage indexed PDF, DOCX, TXT, and Markdown knowledge sources.
          </p>
        </div>

        <DocumentList
          documents={documents}
          onDelete={handleDelete}
          onOpenUpload={() => setIsUploadOpen(true)}
          isLoading={isLoading}
        />

        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          workspaceId={workspaceId}
          onUploadSuccess={fetchDocuments}
        />
      </div>
    </AppShell>
  );
}
