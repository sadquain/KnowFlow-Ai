import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Terms of Service (Draft) • KnowFlow AI",
  description: "Terms of service and acceptable use policy for KnowFlow AI.",
};

export default function TermsPage() {
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
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider text-amber-300">
              Draft Document — For Demonstration Only
            </span>
            <p className="mt-1 text-amber-200/90 leading-relaxed">
              These Terms of Service are a template placeholder illustrating acceptable use policies and
              AI disclaimer requirements for KnowFlow AI.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md space-y-8">
          <div className="border-b border-slate-800 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs text-slate-400">Last updated: October 2026 • Status: Draft</p>
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              <h2>1. Acceptance of Terms</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              By accessing or using KnowFlow AI, you agree to be bound by these Terms of Service. If you are
              accessing the platform on behalf of an enterprise entity, you represent that you possess the
              authority to bind that entity to these provisions.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <h2>2. AI-Assisted Output &amp; Verifiable Citations</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              KnowFlow AI utilizes Retrieval-Augmented Generation (RAG) to ground LLM completions in indexed
              source documents. While every completion includes verifiable citations, similarity scores, and page
              numbers, users remain solely responsible for reviewing and confirming critical facts before making
              legal, financial, medical, or mission-critical business decisions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white">3. Acceptable Use &amp; File Formats</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Users may upload PDF, DOCX, TXT, and Markdown files up to 10MB per document. Uploading
              malicious payloads, confidential data without proper authorization, or materials violating copyright
              laws is strictly prohibited and subject to immediate workspace suspension.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white">4. API Rate Limits &amp; Service Availability</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              To prevent abuse and preserve fair usage across all workspace tenants, KnowFlow AI enforces
              rate limits (default: 30 requests per minute per user). Automated scripts or bots circumventing
              rate-limiting mechanisms will be throttled with HTTP 429 status codes.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
