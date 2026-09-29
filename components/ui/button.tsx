import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          // Variants
          variant === "default" &&
            "bg-[#31889C] text-white hover:bg-[#266F80] shadow-sm shadow-[#31889C]/20 active:bg-[#1D5663]",
          variant === "secondary" &&
            "bg-white text-[#31889C] hover:bg-[#F0F9FA] border border-[#31889C]",
          variant === "outline" &&
            "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm",
          variant === "ghost" &&
            "text-slate-700 hover:bg-[#F0F9FA] hover:text-[#31889C]",
          variant === "success" &&
            "bg-[#7CC563] text-white hover:bg-[#68AF51] shadow-sm shadow-[#7CC563]/20",
          variant === "danger" &&
            "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20",
          // Sizes
          size === "sm" && "px-2.5 py-1.5 text-[12px]",
          size === "md" && "px-4 py-2 text-[13px]",
          size === "lg" && "px-5 py-2.5 text-[14px]",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
