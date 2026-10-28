"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import { FileText, BotMessageSquare, Clock, Layers, Activity } from "lucide-react";

interface AnalyticsMetrics {
  totalDocuments: number;
  readyDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
  totalChunks: number;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageLatencyMs: number;
  totalPromptTokens?: number;
  totalCompletionTokens?: number;
  totalTokens?: number;
}

export interface TelemetryRecord {
  id: string;
  provider: string;
  model: string;
  latency_ms: number;
  status: string;
  created_at: string;
}

interface AnalyticsViewProps {
  metrics: AnalyticsMetrics;
  recentUsage?: TelemetryRecord[];
}

const PIE_COLORS = ["#10B981", "#06B6D4", "#EF4444"];

export function AnalyticsView({ metrics, recentUsage = [] }: AnalyticsViewProps) {
  const documentStatusData = [
    { name: "Ready", value: metrics.readyDocuments },
    { name: "Processing", value: metrics.processingDocuments },
    { name: "Failed", value: metrics.failedDocuments },
  ].filter((d) => d.value > 0);

  const queryOutcomeData = [
    { name: "Success", queries: metrics.successfulQueries },
    { name: "Failed / Cancelled", queries: metrics.failedQueries },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Indexed Documents"
          value={metrics.totalDocuments}
          subtitle={`${metrics.readyDocuments} ready for search`}
          icon={FileText}
          colorScheme="blue"
        />
        <StatCard
          title="Vector Chunks"
          value={metrics.totalChunks}
          subtitle="pgvector 768-dim embeddings"
          icon={Layers}
          colorScheme="cyan"
        />
        <StatCard
          title="AI Questions"
          value={metrics.totalQueries}
          subtitle={`${metrics.successfulQueries} successful answers`}
          icon={BotMessageSquare}
          colorScheme="violet"
        />
        <StatCard
          title="Average Latency"
          value={metrics.averageLatencyMs > 0 ? `${metrics.averageLatencyMs}ms` : "N/A"}
          subtitle="Retrieval & generation speed"
          icon={Clock}
          colorScheme="emerald"
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Document Ingestion Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">Document Processing Distribution</h2>
          <p className="mt-1 text-xs text-slate-500">
            Current status of uploaded documents in this workspace.
          </p>

          <div className="mt-6 h-64 w-full">
            {documentStatusData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No documents uploaded yet to display distribution.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={documentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {documentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      borderColor: "#E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Query Success vs Failure Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">AI Query Execution Outcomes</h2>
          <p className="mt-1 text-xs text-slate-500">
            Real retrieval and generation request telemetry from PostgreSQL.
          </p>

          <div className="mt-6 h-64 w-full">
            {metrics.totalQueries === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No AI questions asked yet. Start a conversation in the AI Assistant.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={queryOutcomeData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      borderColor: "#E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="queries" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Telemetry Log Table */}
      {recentUsage.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Recent AI Telemetry Events</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pr-4">Provider</th>
                  <th className="pb-3 pr-4">Model</th>
                  <th className="pb-3 pr-4">Latency</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentUsage.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-4 font-semibold capitalize text-slate-900">
                      {u.provider}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-slate-600">{u.model}</td>
                    <td className="py-2.5 pr-4 font-mono text-slate-600">
                      {u.latency_ms ? `${u.latency_ms}ms` : "-"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          u.status === "success"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
