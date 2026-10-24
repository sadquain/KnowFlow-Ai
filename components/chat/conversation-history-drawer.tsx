"use client";

import React from "react";
import { MessageSquare, Plus, Trash2, X, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface ConversationSummary {
  id: string;
  workspace_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ConversationHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationSummary[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationHistoryDrawer({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationHistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="relative flex w-full max-w-xs flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Chat History</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat history"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No previous conversations yet.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition ${
                    isActive
                      ? "bg-blue-50 text-blue-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                    className="flex-1 text-left truncate mr-2"
                  >
                    <div className="truncate">{conv.title || "Untitled Conversation"}</div>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 font-normal">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(conv.updated_at || conv.created_at)}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    title="Delete conversation"
                    aria-label={`Delete conversation ${conv.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );
}
