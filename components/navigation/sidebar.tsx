"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BotMessageSquare,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";

interface SidebarProps {
  currentWorkspaceId?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentWorkspaceId, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { workspaceId } = useWorkspace();
  const activeWsId = workspaceId || currentWorkspaceId || "";

  const navItems = [
    {
      label: "Dashboard",
      href: `/dashboard${activeWsId ? `?ws=${activeWsId}` : ""}`,
      icon: LayoutDashboard,
      activePattern: /^\/dashboard/,
    },
    {
      label: "AI Assistant",
      href: `/chat${activeWsId ? `?ws=${activeWsId}` : ""}`,
      icon: BotMessageSquare,
      activePattern: /^\/chat/,
    },
    {
      label: "Documents",
      href: `/documents${activeWsId ? `?ws=${activeWsId}` : ""}`,
      icon: FileText,
      activePattern: /^\/documents/,
    },
    {
      label: "Analytics",
      href: `/analytics${activeWsId ? `?ws=${activeWsId}` : ""}`,
      icon: BarChart3,
      activePattern: /^\/analytics/,
    },
    {
      label: "Settings",
      href: `/settings${activeWsId ? `?ws=${activeWsId}` : ""}`,
      icon: Settings,
      activePattern: /^\/settings/,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 flex h-full w-64 flex-col border-r border-slate-200 bg-white transition-transform md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        aria-label="Sidebar Navigation"
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              KnowFlow <span className="text-blue-600">AI</span>
            </span>
            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Instant Knowledge RAG
            </p>
          </div>
        </div>

        {/* Workspace Quick Selector */}
        <div className="px-4 py-3">
          <WorkspaceSwitcher variant="sidebar" />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-3 py-2" aria-label="Main Menu">
          {navItems.map((item) => {
            const isActive = item.activePattern.test(pathname);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-50 text-blue-600 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-linear-to-br from-blue-50 via-cyan-50 to-violet-50 p-3 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-semibold text-blue-900">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              Ollama & Cloud Ready
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Multi-provider RAG with PostgreSQL pgvector.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
