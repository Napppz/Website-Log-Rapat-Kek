import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "teal"
    | "emerald"
    | "yellow"
    | "orange"
    | "amber"
    | "red"
    | "slate"
    | "draft"
    | "review"
    | "approved"
    | "final"
    | "urgent";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const dotColor = {
    default: "bg-[#1E6B7B]",
    teal: "bg-[#1E6B7B]",
    emerald: "bg-[#16A34A]",
    yellow: "bg-[#CA8A04]",
    orange: "bg-[#EA580C]",
    amber: "bg-[#D97706]",
    red: "bg-[#DC2626]",
    slate: "bg-slate-400",
    draft: "bg-slate-400",
    review: "bg-[#CA8A04]",
    approved: "bg-[#0284C7]",
    final: "bg-[#16A34A]",
    urgent: "bg-[#DC2626]",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium text-[11px] tracking-wide transition-colors select-none",
        variant === "default" && "bg-[#F0F8FA] border border-[#BCE3EB] text-[#174853]",
        variant === "teal" && "bg-[#1E6B7B] text-white shadow-2xs border border-[#175360]",
        variant === "emerald" && "bg-[#ECF8E9] border border-[#D2EFCA] text-[#15803D]",
        variant === "yellow" && "bg-[#FEF9C3] border border-[#FDE047] text-[#854D0E]",
        (variant === "orange" || variant === "amber") && "bg-[#FFF0DC] border border-[#FEDEBE] text-[#C2410C]",
        variant === "red" && "bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C]",
        variant === "slate" && "bg-slate-100 border border-slate-200 text-slate-700",
        // Semantic Meeting Statuses
        variant === "draft" && "bg-slate-100 border border-slate-200 text-slate-700",
        variant === "review" && "bg-[#FEF9C3] border border-[#FDE047] text-[#854D0E]",
        variant === "approved" && "bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1]",
        variant === "final" && "bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D]",
        variant === "urgent" && "bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C]",
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
