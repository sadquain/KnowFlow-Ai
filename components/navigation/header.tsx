"use client";

import React, { useState, useEffect } from "react";
import { Menu, Terminal, LogOut, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/auth-modal";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  onToggleSidebar?: () => void;
  activeProvider?: string;
}

export function Header({ onToggleSidebar, activeProvider = "gemini" }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === "SIGNED_OUT") {
        if (typeof window !== "undefined") {
          localStorage.removeItem("knowflow_active_workspace_id");
          window.location.replace("/");
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Header] Sign out error:", err);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("knowflow_active_workspace_id");
        window.location.replace("/");
      }
    }
  };

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

        <div className="hidden sm:block min-w-44">
          <WorkspaceSwitcher variant="header" />
        </div>
      </div>

      {/* Right: Active AI Engine Status Badge & Auth Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-700">
          <Terminal className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
          <span className="capitalize">{activeProvider}</span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAuthOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </header>
  );
}
