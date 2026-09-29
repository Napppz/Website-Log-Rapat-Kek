import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "teal" | "emerald" | "yellow" | "orange" | "amber" | "red" | "slate";
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
        variant === "default" && "bg-[#E8F5F7] border border-[#BCE3EB] text-[#31889C]",
        variant === "teal" && "bg-[#31889C] text-white shadow-xs",
        variant === "emerald" && "bg-[#ECF8E9] border border-[#D2EFCA] text-[#4D8F3D]",
        variant === "yellow" && "bg-[#FFF8CC] border border-[#FFEE99] text-[#8A7200]",
        (variant === "orange" || variant === "amber") && "bg-[#FFF0DC] border border-[#FEDEBE] text-[#B96800]",
        variant === "red" && "bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]",
        variant === "slate" && "bg-slate-100 border border-slate-200 text-slate-700",
        className
      )}
      {...props}
    />
  );
}
