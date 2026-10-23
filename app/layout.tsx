import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KnowFlow AI — Turn Your Knowledge into Instant Answers",
  description:
    "Grounded Retrieval-Augmented Generation (RAG) SaaS platform. Ask questions, discover insights, and get verifiable answers anchored in your own documents.",
  keywords: [
    "AI",
    "RAG",
    "Retrieval-Augmented Generation",
    "LangChain",
    "Supabase",
    "pgvector",
    "Ollama",
    "Gemini",
    "Groq",
  ],
  authors: [{ name: "KnowFlow AI Engineering Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
