"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Square, AlertCircle, Sparkles, History, Plus, FileText } from "lucide-react";
import { MessageItem, type ChatMessage } from "./message-item";
import { CitationPreviewDrawer } from "./citation-preview-drawer";
import { ModelSelector } from "./model-selector";
import { ConversationHistoryDrawer, type ConversationSummary } from "./conversation-history-drawer";
import type { GroundedCitation, SupportedAIProvider } from "@/lib/ai/types";

interface ChatBoxProps {
  workspaceId: string;
}

export function ChatBox({ workspaceId }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<GroundedCitation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  // Model & Provider Selection
  const [selectedProvider, setSelectedProvider] = useState<SupportedAIProvider>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("knowflow_ai_provider");
      if (saved === "gemini" || saved === "groq" || saved === "ollama") return saved;
    }
    return "gemini";
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("knowflow_ai_model");
      if (saved) return saved;
    }
    return "gemini-3.5-flash";
  });

  // Conversation Threads & Persistence
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Document Source Filter
  const [workspaceDocs, setWorkspaceDocs] = useState<{ id: string; title: string }[]>([]);
  const [filterDocId, setFilterDocId] = useState<string>("all");

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available ready documents for source filtering
  useEffect(() => {
    let ignore = false;
    async function loadWorkspaceDocs() {
      try {
        const res = await fetch(`/api/documents?workspaceId=${workspaceId}`);
        if (res.ok && !ignore) {
          const data = await res.json();
          const readyDocs = (data.documents || [])
            .filter((d: { status: string }) => d.status === "ready")
            .map((d: { id: string; title: string }) => ({ id: d.id, title: d.title }));
          setWorkspaceDocs(readyDocs);
        }
      } catch {
        // Ignored
      }
    }
    loadWorkspaceDocs();
    return () => {
      ignore = true;
    };
  }, [workspaceId]);

  // Fetch conversations for workspace
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // Ignore background load failures
    }
  }, [workspaceId]);

  useEffect(() => {
    let ignore = false;
    async function fetchInitial() {
      try {
        const res = await fetch(`/api/conversations?workspaceId=${workspaceId}`);
        if (res.ok && !ignore) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch {
        // Ignore background load failures
      }
    }
    fetchInitial();
    return () => {
      ignore = true;
    };
  }, [workspaceId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleModelChange = (provider: SupportedAIProvider, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
    try {
      localStorage.setItem("knowflow_ai_provider", provider);
      localStorage.setItem("knowflow_ai_model", model);
    } catch {
      // Ignore
    }
  };

  // Load specific conversation
  const handleSelectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      setErrorMsg("Failed to load previous messages.");
    }
  };

  // Start new conversation
  const handleNewConversation = () => {
    setActiveConversationId(undefined);
    setMessages([]);
    setErrorMsg(null);
    setInput("");
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: string) => {
    try {
      await fetch(`/api/conversations/${convId}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleNewConversation();
      }
    } catch {
      // Ignore
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      setLiveAnnouncement("AI response generation stopped.");
    }
  };

  const handleSend = async (overridePrompt?: string) => {
    const questionText = (overridePrompt || input).trim();
    if (!questionText || isGenerating) return;

    setErrorMsg(null);
    setInput("");
    setIsGenerating(true);
    setLiveAnnouncement("AI question submitted. Generation started.");

    // Add user message
    const userMsgId = `msg-user-${crypto.randomUUID()}`;
    const assistantMsgId = `msg-assistant-${crypto.randomUUID()}`;

    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, role: "user", content: questionText },
      { id: assistantMsgId, role: "assistant", content: "", isStreaming: true, citations: [] },
    ];
    setMessages(newMessages);

    // Set up abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          workspaceId,
          conversationId: activeConversationId,
          provider: selectedProvider,
          model: selectedModel,
          documentIds: filterDocId !== "all" ? [filterDocId] : undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body stream received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      const streamState = {
        content: "",
        citations: [] as GroundedCitation[],
        messageId: undefined as string | undefined,
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "conversation") {
                setActiveConversationId(data.conversationId);
              } else if (data.type === "citations") {
                streamState.citations = data.citations;
              } else if (data.type === "token") {
                streamState.content += data.token;
              } else if (data.type === "done" && data.messageId) {
                streamState.messageId = data.messageId;
              } else if (data.type === "error") {
                setErrorMsg(data.error);
              }

              const currentContent = streamState.content;
              const currentCitations = streamState.citations;

              // Update message in state
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        content: currentContent,
                        citations: currentCitations,
                        isStreaming: true,
                      }
                    : msg
                )
              );
            } catch {
              // Ignore non-json chunks
            }
          }
        }
      }

      // Mark generation complete and assign persisted DB messageId if available
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                id: streamState.messageId || msg.id,
                isStreaming: false,
              }
            : msg
        )
      );
      setLiveAnnouncement(`AI response completed with ${streamState.citations.length} citations.`);

      // Refresh conversations list to update title
      loadConversations();
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (isAbort) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: msg.content + "\n\n*(Generation stopped by user)*",
                  isStreaming: false,
                }
              : msg
          )
        );
      } else {
        const errorMsg = err instanceof Error ? err.message : "Failed to generate answer.";
        setErrorMsg(errorMsg);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `⚠️ ${errorMsg}`,
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleFeedback = async (messageId: string, isPositive: boolean) => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          messageId,
          isPositive,
        }),
      });
    } catch (err) {
      console.error("[chat-box] Failed to submit feedback:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Top Toolbar: Model Selector, Document Filter & Thread Controls */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-4 py-2.5 gap-2 bg-slate-50/50 rounded-t-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <ModelSelector
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            onSelect={handleModelChange}
            disabled={isGenerating}
          />

          {workspaceDocs.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-2xs">
              <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <select
                value={filterDocId}
                onChange={(e) => setFilterDocId(e.target.value)}
                disabled={isGenerating}
                aria-label="Filter knowledge source document"
                className="bg-transparent text-xs text-slate-700 focus:outline-none max-w-[130px] truncate"
              >
                <option value="all">All Documents ({workspaceDocs.length})</option>
                {workspaceDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            aria-label="Open conversation history"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">History</span>
            {conversations.length > 0 && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                {conversations.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleNewConversation}
            disabled={isGenerating}
            title="Start a new chat thread"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Screen reader live announcement */}
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>

      {/* Messages Scroll Area */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-6"
        role="log"
        aria-label="Conversation history"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-violet-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Ask anything about your knowledge base
            </h2>
            <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
              KnowFlow AI searches your documents with vector similarity and provides verified
              answers with exact source citations.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "Summarize key findings from my documents",
                "What are the main risks and recommendations?",
                "Compare section 2 against the summary",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/80 hover:text-blue-700 transition"
                >
                  &ldquo;{suggestion}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onSelectCitation={(cite) => setSelectedCitation(cite)}
              onRegenerate={() => {
                const lastUser = [...messages].reverse().find((m) => m.role === "user");
                if (lastUser) handleSend(lastUser.content);
              }}
              onFeedback={(isPos) => handleFeedback(message.id, isPos)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div
          className="mx-4 mb-2 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Box */}
      <div className="border-t border-slate-100 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 p-2 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your knowledge base... (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={isGenerating}
            aria-label="Ask AI a question"
            className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                type="button"
                onClick={handleStop}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600"
                aria-label="Stop generation"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-blue-600 to-violet-600 p-2.5 text-white shadow-xs transition-all hover:opacity-95 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Citation Preview Modal */}
      <CitationPreviewDrawer
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />

      {/* Conversation History Drawer */}
      <ConversationHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />
    </div>
  );
}
