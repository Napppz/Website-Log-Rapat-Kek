import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          // Variants
          variant === "default" &&
            "bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-600/20",
          variant === "secondary" &&
            "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300",
          variant === "outline" &&
            "bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 shadow-sm",
          variant === "ghost" &&
            "text-slate-700 hover:bg-amber-50 hover:text-amber-800",
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
