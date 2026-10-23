"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Square, AlertCircle, Sparkles, CornerDownLeft } from "lucide-react";
import { MessageItem, type ChatMessage } from "./message-item";
import { CitationPreviewDrawer } from "./citation-preview-drawer";
import type { GroundedCitation } from "@/lib/ai/types";

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

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    const userMsgId = `msg-user-${Date.now()}`;
    const assistantMsgId = `msg-assistant-${Date.now()}`;

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
      let assistantContent = "";
      let resolvedCitations: GroundedCitation[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "citations") {
                resolvedCitations = data.citations;
              } else if (data.type === "token") {
                assistantContent += data.token;
              } else if (data.type === "error") {
                setErrorMsg(data.error);
              }

              // Update message in state
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        content: assistantContent,
                        citations: resolvedCitations,
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

      // Mark generation complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
      setLiveAnnouncement(
        `AI response completed with ${resolvedCitations.length} citations.`
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
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
        setErrorMsg(err?.message || "Failed to generate answer.");
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
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
      {/* Screen reader live announcement */}
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6" role="log" aria-label="Conversation history">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-violet-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Ask anything about your knowledge base
            </h2>
            <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
              KnowFlow AI will search your uploaded documents with pgvector and synthesize an answer grounded strictly in verified sources.
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
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/80 hover:text-blue-700"
                >
                  "{suggestion}"
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
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mx-4 mb-2 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
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
    </div>
  );
}
