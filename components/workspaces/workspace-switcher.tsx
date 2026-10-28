"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Layers, ChevronDown, Check, Plus, Settings, Sparkles, X } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  className?: string;
  variant?: "sidebar" | "header";
}

export function WorkspaceSwitcher({ className, variant = "sidebar" }: WorkspaceSwitcherProps) {
  const { workspaces, currentWorkspace, setCurrentWorkspaceId, refreshWorkspaces } =
    useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (id: string) => {
    setCurrentWorkspaceId(id);
    setIsOpen(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create workspace.");
      }

      await refreshWorkspaces();
      if (data.workspace?.id) {
        setCurrentWorkspaceId(data.workspace.id);
      }
      setNewWorkspaceName("");
      setIsCreateOpen(false);
      setIsOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Creation failed.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Switch workspace"
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-xl transition text-left",
          variant === "sidebar"
            ? "border border-slate-200/90 bg-white p-2.5 text-xs text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50/80"
            : "border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-xs hover:bg-slate-50"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Layers className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 truncate">
            <p className="font-semibold text-slate-800 truncate">
              {currentWorkspace?.name || "Workspace"}
            </p>
            {variant === "sidebar" && (
              <p className="text-[10px] text-slate-400 truncate">pgvector · RLS active</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180 text-blue-600"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Workspaces ({workspaces.length})
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {workspaces.map((ws) => {
              const isSelected = ws.id === currentWorkspace?.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(ws.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-left transition",
                    isSelected
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                  )}
                >
                  <div className="min-w-0 flex-1 truncate">
                    <p className="truncate font-semibold">{ws.name}</p>
                    <p className="text-[10px] text-slate-400 truncate font-mono">
                      {ws.slug || ws.id.substring(0, 8)}
                    </p>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-slate-100 pt-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Workspace</span>
            </button>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              <span>Workspace Settings</span>
            </Link>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">New Workspace</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="workspace-name-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Workspace Name
                </label>
                <input
                  id="workspace-name-input"
                  type="text"
                  required
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g. Legal Research, Sales Ops"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {createError && (
                <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg" role="alert">
                  {createError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newWorkspaceName.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isCreating ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
