import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, AlertCircle, Lock, Database } from "lucide-react";

export const metadata = {
  title: "Privacy Policy (Draft) • KnowFlow AI",
  description: "Privacy policy and multi-tenant data governance terms for KnowFlow AI.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Draft Notice Banner */}
        <div
          className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider text-amber-300">
              Draft Document — For Demonstration Only
            </span>
            <p className="mt-1 text-amber-200/90 leading-relaxed">
              This document is a technical compliance placeholder illustrating KnowFlow AI&apos;s
              data isolation and governance architecture. It does not constitute legal counsel.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md space-y-8">
          <div className="border-b border-slate-800 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Privacy Policy &amp; Data Governance
            </h1>
            <p className="mt-2 text-xs text-slate-400">
              Last updated: October 2026 • Status: Draft
            </p>
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Lock className="h-4 w-4 text-blue-400" />
              <h2>1. Multi-Tenant Isolation &amp; Row-Level Security</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              KnowFlow AI enforces tenant isolation directly inside PostgreSQL using Supabase
              Row-Level Security (RLS). All uploaded documents, extracted chunk vectors,
              conversation logs, and rate-limit buckets are strictly partitioned by authenticated
              workspace membership. Cross-tenant queries are denied at the database query planner
              level.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Database className="h-4 w-4 text-emerald-400" />
              <h2>2. Vector Embeddings &amp; AI Provider Privacy</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Document chunks are embedded using high-dimensional vector representations stored in
              pgvector. When invoking third-party inference providers (Google Gemini, Groq, or local
              Ollama), only the specific relevant snippets retrieved for the user&apos;s query are
              transmitted in the context prompt. We do not permit foundational models to train on
              customer workspace data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white">
              3. Data Retention &amp; Deletion Rights
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Workspace owners possess the right to delete documents or delete entire workspaces at
              any time. Deleting a workspace cascades immediately: all file storage objects in
              Supabase Storage, database records in PostgreSQL, and pgvector embeddings are
              permanently expunged.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white">
              4. User Authentication &amp; Telemetry
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Authentication is managed through Supabase Auth with encrypted JWT sessions. Usage
              telemetry (token counts and latency) is retained solely for internal performance
              monitoring and rate-limiting enforcement.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
