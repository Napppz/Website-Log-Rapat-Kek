import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "amber" | "emerald" | "red" | "slate";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] transition-colors",
        variant === "default" && "bg-amber-100 border border-amber-300 text-amber-800",
        variant === "amber" && "bg-amber-600 text-white shadow-xs",
        variant === "emerald" && "bg-emerald-100 border border-emerald-300 text-emerald-800",
        variant === "red" && "bg-red-100 border border-red-300 text-red-800",
        variant === "slate" && "bg-slate-100 border border-slate-300 text-slate-600",
        className
      )}
      {...props}
    />
  );
}
