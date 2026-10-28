"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, UploadCloud, ArrowRight, ShieldCheck, Zap } from "lucide-react";

interface DashboardHeroProps {
  onOpenUpload?: () => void;
  workspaceId?: string;
}

export function DashboardHero({ onOpenUpload, workspaceId }: DashboardHeroProps) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-br from-white via-blue-50/40 to-violet-50/50 p-6 shadow-xs sm:p-8 md:p-10"
      aria-labelledby="hero-heading"
    >
      {/* Decorative Blur Orbs */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-3xl">
        {/* Subtle Badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>Grounded RAG with pgvector & LangChain.js</span>
        </div>

        {/* Master Headline */}
        <h1
          id="hero-heading"
          className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
        >
          Your knowledge,{" "}
          <span className="bg-linear-to-r from-blue-600 via-cyan-600 to-violet-600 bg-clip-text text-transparent">
            now instantly accessible.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          Ask questions, discover insights, and get answers grounded in your own documents. Every
          answer is anchored by verifiable citations and zero hallucinations.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center gap-3.5">
          <Link
            href={workspaceId ? `/chat?ws=${workspaceId}` : "/chat"}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:opacity-95 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Sparkles className="h-4 w-4" />
            <span>Ask AI</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <UploadCloud className="h-4 w-4 text-cyan-600" />
            <span>Upload documents</span>
          </button>
        </div>

        {/* Micro Badges */}
        <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Multi-tenant Isolation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Sub-second Vector Search</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            <span>100% Free-Tier Architecture</span>
          </div>
        </div>
      </div>
    </section>
  );
}
