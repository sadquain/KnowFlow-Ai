"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ChatBox } from "@/components/chat/chat-box";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Sparkles, Loader2 } from "lucide-react";

function ChatContent() {
  const { workspaceId, isLoading } = useWorkspace();

  return (
    <div className="space-y-4">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              AI Knowledge Assistant
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Grounded answers generated with LangChain.js and pgvector retrieval.
          </p>
        </div>
      </div>

      {/* Chat Box Container */}
      {isLoading || !workspaceId ? (
        <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span>Connecting to workspace...</span>
          </div>
        </div>
      ) : (
        <ChatBox workspaceId={workspaceId} />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <AppShell>
      <ChatContent />
    </AppShell>
  );
}
