"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUploadModal } from "@/components/documents/document-upload-modal";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { FileText } from "lucide-react";
import type { DocumentItem } from "@/components/documents/document-card";

function DocumentsContent() {
  const { workspaceId, isLoading: isWsLoading } = useWorkspace();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!workspaceId) return;
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
    if (!workspaceId) return;
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
  }, [workspaceId, isWsLoading]);

  const handleDelete = async (id: string) => {
    if (!workspaceId) return;
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
        isLoading={isLoading || isWsLoading}
      />

      {workspaceId && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          workspaceId={workspaceId}
          onUploadSuccess={fetchDocuments}
        />
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <AppShell>
      <DocumentsContent />
    </AppShell>
  );
}
