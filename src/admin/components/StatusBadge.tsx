import React from "react";
import { cn } from "@/lib/utils";

type StatusVariant =
  | "active"
  | "expired"
  | "cancelled"
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "verified"
  | "unverified"
  | string;

const VARIANT_STYLES: Record<string, string> = {
  active:     "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed:  "bg-emerald-100 text-emerald-800 border-emerald-200",
  verified:   "bg-emerald-100 text-emerald-800 border-emerald-200",
  pending:    "bg-amber-100 text-amber-800 border-amber-200",
  expired:    "bg-slate-100 text-slate-600 border-slate-200",
  cancelled:  "bg-red-100 text-red-800 border-red-200",
  failed:     "bg-red-100 text-red-800 border-red-200",
  unverified: "bg-orange-100 text-orange-800 border-orange-200",
  refunded:   "bg-purple-100 text-purple-800 border-purple-200",
};

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status?.toLowerCase() ?? "unknown";
  const styles = VARIANT_STYLES[normalized] ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        styles,
        className
      )}
    >
      {status}
    </span>
  );
}
