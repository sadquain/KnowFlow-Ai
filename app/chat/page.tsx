"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ChatBox } from "@/components/chat/chat-box";
import { Sparkles } from "lucide-react";

export default function ChatPage() {
  const [workspaceId] = useState("default-ws");

  return (
    <AppShell workspaceId={workspaceId}>
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
        <ChatBox workspaceId={workspaceId} />
      </div>
    </AppShell>
  );
}
