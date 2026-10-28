"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardHero } from "@/components/dashboard/hero";
import { StatCard } from "@/components/dashboard/stat-card";
import { DocumentUploadModal } from "@/components/documents/document-upload-modal";
import { DocumentCard, type DocumentItem } from "@/components/documents/document-card";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { FileText, Layers, BotMessageSquare, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const { workspaceId, isLoading: isWsLoading } = useWorkspace();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalDocuments: 0,
    totalChunks: 0,
    totalQueries: 0,
    averageLatencyMs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const docsRes = await fetch(`/api/documents?workspaceId=${workspaceId}`);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }

      const analyticsRes = await fetch(`/api/analytics?workspaceId=${workspaceId}`);
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        if (analyticsData.metrics) {
          setMetrics(analyticsData.metrics);
        }
      }
    } catch {
      // Keep initial states
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    let ignore = false;
    async function loadData() {
      try {
        const docsRes = await fetch(`/api/documents?workspaceId=${workspaceId}`);
        if (docsRes.ok && !ignore) {
          const docsData = await docsRes.json();
          setDocuments(docsData.documents || []);
        }

        const analyticsRes = await fetch(`/api/analytics?workspaceId=${workspaceId}`);
        if (analyticsRes.ok && !ignore) {
          const analyticsData = await analyticsRes.json();
          if (analyticsData.metrics) {
            setMetrics(analyticsData.metrics);
          }
        }
      } catch {
        // Handled
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, [workspaceId, isWsLoading]);

  const [retryingDocId, setRetryingDocId] = useState<string | null>(null);

  const handleDeleteDocument = async (id: string) => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/documents/${id}?workspaceId=${workspaceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch {
      // Handled
    }
  };

  const handleRetryDocument = async (id: string) => {
    if (!workspaceId) return;
    try {
      setRetryingDocId(id);
      const res = await fetch(`/api/documents/${id}/retry?workspaceId=${workspaceId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Retry failed.");
      }
      await fetchDashboardData();
    } catch (err) {
      console.error("Retry failed:", err);
    } finally {
      setRetryingDocId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <DashboardHero
        onOpenUpload={() => setIsUploadOpen(true)}
        workspaceId={workspaceId || undefined}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={metrics.totalDocuments}
          icon={FileText}
          subtitle="Indexed knowledge sources"
          colorScheme="blue"
        />
        <StatCard
          title="Vector Chunks"
          value={metrics.totalChunks}
          icon={Layers}
          subtitle="Extracted & embedded"
          colorScheme="violet"
        />
        <StatCard
          title="Queries Processed"
          value={metrics.totalQueries}
          icon={BotMessageSquare}
          subtitle="Verified citations"
          colorScheme="emerald"
        />
        <StatCard
          title="Avg Retrieval Latency"
          value={`${metrics.averageLatencyMs}ms`}
          icon={Clock}
          subtitle="HNSW cosine match"
          colorScheme="cyan"
        />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Documents */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Knowledge Documents</h2>
              <p className="text-xs text-slate-400">Latest parsed and embedded files</p>
            </div>
            <Link
              href={`/documents${workspaceId ? `?ws=${workspaceId}` : ""}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4">
            {isLoading || isWsLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No documents uploaded yet. Click &ldquo;Upload documents&rdquo; above to add your
                first file.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {documents.slice(0, 3).map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onDelete={handleDeleteDocument}
                    onRetry={handleRetryDocument}
                    isRetrying={retryingDocId === doc.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {workspaceId && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          workspaceId={workspaceId}
          onUploadSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
