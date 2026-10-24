"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardHero } from "@/components/dashboard/hero";
import { StatCard } from "@/components/dashboard/stat-card";
import { DocumentUploadModal } from "@/components/documents/document-upload-modal";
import { DocumentCard, type DocumentItem } from "@/components/documents/document-card";
import { FileText, Layers, BotMessageSquare, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [workspaceId] = useState("default-ws");
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
        // Keep initial states
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
  }, [workspaceId]);

  const handleDeleteDocument = async (id: string) => {
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

  return (
    <AppShell workspaceId={workspaceId}>
      <div className="space-y-8">
        {/* Dashboard Hero */}
        <DashboardHero
          workspaceId={workspaceId}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Metric Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Documents"
            value={metrics.totalDocuments}
            subtitle="Uploaded & indexed"
            icon={FileText}
            colorScheme="blue"
          />
          <StatCard
            title="Vector Chunks"
            value={metrics.totalChunks}
            subtitle="pgvector embeddings"
            icon={Layers}
            colorScheme="cyan"
          />
          <StatCard
            title="Total Questions"
            value={metrics.totalQueries}
            subtitle="Synthesized answers"
            icon={BotMessageSquare}
            colorScheme="violet"
          />
          <StatCard
            title="Avg Latency"
            value={metrics.averageLatencyMs > 0 ? `${metrics.averageLatencyMs}ms` : "N/A"}
            subtitle="Search & streaming speed"
            icon={Clock}
            colorScheme="emerald"
          />
        </div>

        {/* Recent Knowledge Base Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Documents</h2>
              <p className="text-xs text-slate-500">
                Documents available for grounding AI questions in this workspace.
              </p>
            </div>
            <Link
              href={`/documents?ws=${workspaceId}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No documents uploaded yet. Click &ldquo;Upload documents&rdquo; above to add your first file.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {documents.slice(0, 3).map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onDelete={handleDeleteDocument}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        workspaceId={workspaceId}
        onUploadSuccess={fetchDashboardData}
      />
    </AppShell>
  );
}
