"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  FileText,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Database,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/auth-modal";
import type { User } from "@supabase/supabase-js";

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(() => searchParams.get("auth") === "required");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let ignore = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!ignore) {
        if (data?.user) {
          setUser(data.user);
        }
        setIsCheckingAuth(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) {
        setUser(session?.user || null);
      }
    });

    return () => {
      ignore = true;
      subscription?.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    const redirectPath = searchParams.get("redirect") || "/dashboard";
    router.push(redirectPath);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white flex flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">KnowFlow</span>
              <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
                AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isCheckingAuth ? (
              <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-800" />
            ) : user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-blue-500 transition"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white border border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-28 lg:pb-32">
          {/* Subtle background glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-[480px] w-[600px] rounded-full bg-blue-600/15 blur-[128px]" />
            <div className="h-[360px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px] -translate-x-32" />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-300 backdrop-blur-xs mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Next.js 16 • LangChain • Supabase pgvector</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Enterprise Knowledge Flow &amp;{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
                Verifiable RAG
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
              Transform unstructured PDFs, documents, and corporate records into cited, accurate
              answers. Multi-LLM provider orchestration with Google Gemini, Groq, and local Ollama.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/25 hover:bg-blue-500 transition"
                >
                  <span>Enter Knowledge Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAuthOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/25 hover:bg-blue-500 transition"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    <span>Explore Dashboard</span>
                  </Link>
                </>
              )}
            </div>

            {/* Trust checklist */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Deterministic Citations
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Isolated Workspaces &amp; RLS
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Zero Mock Data Guarantee
              </span>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="relative border-t border-slate-800/80 bg-slate-900/40 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Engineered for Reliability &amp; Precision
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Every layer of KnowFlow AI is architected for verifiable accuracy and secure enterprise
                isolation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-4">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-white">Multi-LLM Provider Engine</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Switch between Google Gemini, Groq ultra-low latency, or local Ollama models on demand.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-white">Verifiable Citations</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Every assistant answer includes page numbers, source snippets, and cosine similarity scores.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-white">Row-Level Security</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Session-authenticated Postgres RLS policies ensure complete isolation across workspaces.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-white">Native pgvector Storage</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  High-dimensional embeddings matched using HNSW vector indexes directly in PostgreSQL.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-500" />
            <span>KnowFlow AI • Enterprise RAG System</span>
          </div>
          <p>© {new Date().getFullYear()} KnowFlow AI. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <LandingContent />
    </Suspense>
  );
}
