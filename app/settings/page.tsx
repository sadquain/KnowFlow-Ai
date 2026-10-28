"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Settings, Shield, Cpu, Database, CheckCircle2 } from "lucide-react";
import { WorkspaceSettingsSection } from "@/components/workspaces/workspace-settings-section";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Settings className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Workspace & Provider Settings
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Manage your workspace team members, AI provider fallbacks, pgvector dimensions, and
            environment secrets.
          </p>
        </div>

        {/* Workspace Management Section */}
        <WorkspaceSettingsSection />

        {/* AI Engine Configuration Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Cpu className="h-4 w-4 text-blue-600" />
            <span>AI Provider Topology</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            KnowFlow AI supports local Ollama inference alongside Google Gemini and Groq free tiers.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">Ollama (Local)</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                100% Free & offline fallback using llama3.2 & nomic-embed-text.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Google Gemini</span>
                <span className="text-[10px] rounded-md bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700">
                  Cloud Free Tier
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                gemini-3.8-flash & gemini-embedding-001 (15 RPM free).
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Groq LPU</span>
                <span className="text-[10px] rounded-md bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700">
                  Cloud Free Tier
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                llama-3.3-70b-versatile ultra-fast inference (30 RPM free).
              </p>
            </div>
          </div>
        </div>

        {/* Database & Vector Store Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Database className="h-4 w-4 text-emerald-600" />
            <span>PostgreSQL & pgvector Configuration</span>
          </div>
          <div className="mt-4 space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-700">Vector Dimension:</span>
              <span className="font-mono text-slate-900">
                768 (nomic-embed-text & gemini-embedding-001)
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-700">Distance Metric:</span>
              <span className="font-mono text-slate-900">Cosine Distance (vector_cosine_ops)</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-700">Index Strategy:</span>
              <span className="font-mono text-slate-900">HNSW (m=16, ef_construction=64)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Multi-tenancy Isolation:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Row Level Security & Workspace Filter Active
              </span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-xs text-blue-900">
          <div className="flex items-center gap-2 font-bold">
            <Shield className="h-4 w-4 text-blue-600" />
            <span>Zero-Trust Security Boundary</span>
          </div>
          <p className="mt-1 leading-relaxed text-blue-800">
            Private credentials (Supabase Service Role Key, Gemini API Key, Groq API Key) are
            strictly evaluated on server-side Next.js route handlers. No API keys are bundled into
            browser bundles.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
