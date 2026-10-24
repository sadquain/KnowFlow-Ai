"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Zap, Sparkles, Check, ChevronDown } from "lucide-react";
import type { SupportedAIProvider } from "@/lib/ai/types";

export interface ModelOption {
  provider: SupportedAIProvider;
  model: string;
  label: string;
  providerLabel: string;
  tag: string;
  icon: React.ElementType;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    provider: "gemini",
    model: "gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    providerLabel: "Google Gemini",
    tag: "Recommended • Fast",
    icon: Sparkles,
  },
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B (Groq)",
    providerLabel: "Groq LPU",
    tag: "Ultra-Fast LPU",
    icon: Zap,
  },
  {
    provider: "ollama",
    model: "llama3.2",
    label: "Llama 3.2 (Local)",
    providerLabel: "Ollama",
    tag: "100% Private • Offline",
    icon: Cpu,
  },
  {
    provider: "gemini",
    model: "gemini-3.1-pro",
    label: "Gemini 3.1 Pro",
    providerLabel: "Google Gemini",
    tag: "Deep Reasoning",
    icon: Sparkles,
  },
];

interface ModelSelectorProps {
  selectedProvider: SupportedAIProvider;
  selectedModel: string;
  onSelect: (provider: SupportedAIProvider, model: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedProvider,
  selectedModel,
  onSelect,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeOption =
    AVAILABLE_MODELS.find(
      (m) => m.provider === selectedProvider && m.model === selectedModel
    ) || AVAILABLE_MODELS.find((m) => m.provider === selectedProvider) || AVAILABLE_MODELS[0];

  const ActiveIcon = activeOption.icon;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#model-selector-dropdown")) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("click", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" id="model-selector-dropdown">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select LLM. Currently selected: ${activeOption.label}`}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md ${
            activeOption.provider === "gemini"
              ? "bg-violet-100 text-violet-700"
              : activeOption.provider === "groq"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          <ActiveIcon className="h-3 w-3" />
        </span>
        <span className="font-semibold text-slate-900">{activeOption.label}</span>
        <span className="hidden sm:inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
          {activeOption.providerLabel}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 mt-2 z-50 w-72 origin-top-left rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Choose LLM Provider
          </div>
          <div className="space-y-1">
            {AVAILABLE_MODELS.map((option) => {
              const isSelected =
                option.provider === selectedProvider &&
                (option.model === selectedModel || (!selectedModel && option.provider === activeOption.provider));
              const Icon = option.icon;

              return (
                <button
                  key={`${option.provider}-${option.model}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(option.provider, option.model);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-start justify-between rounded-xl px-3 py-2.5 text-left transition ${
                    isSelected
                      ? "bg-blue-50/80 text-blue-900"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                        option.provider === "gemini"
                          ? "bg-violet-100 text-violet-700"
                          : option.provider === "groq"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {option.label}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {option.tag}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-blue-600 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
