"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const [workspaceId] = useState("default-ws");
  const [metrics, setMetrics] = useState({
    totalDocuments: 0,
    readyDocuments: 0,
    processingDocuments: 0,
    failedDocuments: 0,
    totalChunks: 0,
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageLatencyMs: 0,
  });
  const [recentUsage, setRecentUsage] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/analytics?workspaceId=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.metrics) setMetrics(data.metrics);
          if (data.recentUsage) setRecentUsage(data.recentUsage);
        }
      } catch {
        // Handled
      }
    };
    fetchAnalytics();
  }, [workspaceId]);

  return (
    <AppShell workspaceId={workspaceId}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Workspace Analytics & Telemetry
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Real usage telemetry, document indexing rates, and retrieval latency from PostgreSQL.
          </p>
        </div>

        <AnalyticsView metrics={metrics} recentUsage={recentUsage} />
      </div>
    </AppShell>
  );
}
