"use client";

import React from "react";
import { Menu, Sparkles, Terminal } from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  activeProvider?: string;
}

export function Header({ onToggleSidebar, activeProvider = "ollama" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 md:pl-70">
      {/* Skip to Content for WCAG 2.2 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-md"
      >
        Skip to main content
      </a>

      {/* Left: Mobile Menu & Current Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs font-medium text-slate-400">Workspace / </span>
          <span className="text-xs font-semibold text-slate-700">Production Knowledge Base</span>
        </div>
      </div>

      {/* Right: Active AI Engine Status Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-700">
          <Terminal className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
          <span className="capitalize">{activeProvider}</span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-tr from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-xs">
          KF
        </div>
      </div>
    </header>
  );
}
