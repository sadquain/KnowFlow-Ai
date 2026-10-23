"use client";

import React, { useState } from "react";
import { User, Sparkles, ThumbsUp, ThumbsDown, RotateCcw, Copy, Check } from "lucide-react";
import { CitationBadge } from "./citation-badge";
import type { GroundedCitation } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: GroundedCitation[];
  isStreaming?: boolean;
}

interface MessageItemProps {
  message: ChatMessage;
  onSelectCitation: (citation: GroundedCitation) => void;
  onRegenerate?: () => void;
  onFeedback?: (isPositive: boolean) => void;
}

export function MessageItem({
  message,
  onSelectCitation,
  onRegenerate,
  onFeedback,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);

  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (isPositive: boolean) => {
    setFeedbackGiven(isPositive ? "up" : "down");
    onFeedback?.(isPositive);
  };

  return (
    <div className={cn("flex gap-3.5 py-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 via-cyan-600 to-violet-600 text-white shadow-xs">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
      )}

      <div
        className={cn(
          "relative max-w-2xl rounded-2xl p-4.5 text-sm leading-relaxed shadow-xs transition-all",
          isUser
            ? "border border-blue-200 bg-blue-50/90 text-slate-900 rounded-tr-xs"
            : "border border-slate-200/90 bg-white text-slate-800 rounded-tl-xs"
        )}
      >
        {/* Message Content */}
        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* Streaming Pulse Indicator */}
        {message.isStreaming && (
          <span className="inline-block h-4 w-1.5 ml-1 bg-blue-600 animate-pulse align-middle" />
        )}

        {/* Grounded Citations Carousel / Badges */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Sources & Citations:
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {message.citations.map((citation, index) => (
                <CitationBadge
                  key={citation.id}
                  citation={citation}
                  index={index}
                  onSelect={onSelectCitation}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions for Assistant Responses */}
        {!isUser && !message.isStreaming && (
          <div className="mt-3.5 flex items-center justify-between border-t border-slate-50 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy response to clipboard"
                className="rounded-md p-1 hover:bg-slate-100 hover:text-slate-600"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>

              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  aria-label="Regenerate response"
                  className="rounded-md p-1 hover:bg-slate-100 hover:text-slate-600"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleFeedback(true)}
                disabled={feedbackGiven !== null}
                aria-label="Mark response as helpful"
                className={cn(
                  "rounded-md p-1 transition-colors hover:bg-emerald-50 hover:text-emerald-600",
                  feedbackGiven === "up" && "bg-emerald-100 text-emerald-700"
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleFeedback(false)}
                disabled={feedbackGiven !== null}
                aria-label="Mark response as not helpful"
                className={cn(
                  "rounded-md p-1 transition-colors hover:bg-red-50 hover:text-red-600",
                  feedbackGiven === "down" && "bg-red-100 text-red-700"
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 shadow-xs">
          <User className="h-4 w-4" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
