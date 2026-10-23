"use client";

import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme: "blue" | "cyan" | "violet" | "emerald" | "amber";
}

const colorStyles = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-100",
    iconBg: "bg-blue-100 text-blue-600",
  },
  cyan: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-100",
    iconBg: "bg-cyan-100 text-cyan-600",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-100",
    iconBg: "bg-violet-100 text-violet-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100",
    iconBg: "bg-amber-100 text-amber-600",
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, colorScheme }: StatCardProps) {
  const styles = colorStyles[colorScheme];

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-5 shadow-xs transition-all hover:shadow-md",
        styles.border
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          {title}
        </span>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", styles.iconBg)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900">
          {value}
        </span>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
