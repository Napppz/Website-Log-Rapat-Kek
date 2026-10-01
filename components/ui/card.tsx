import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: "teal" | "emerald" | "amber" | "orange" | "none";
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, accent = "none", interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl bg-white border border-slate-200 shadow-2xs transition-all duration-200 overflow-hidden",
        interactive && "hover:shadow-md hover:border-slate-300 cursor-pointer",
        accent === "teal" && "border-t-[3px] border-t-[#1E6B7B]",
        accent === "emerald" && "border-t-[3px] border-t-[#7CC563]",
        accent === "amber" && "border-t-[3px] border-t-[#FFD300]",
        accent === "orange" && "border-t-[3px] border-t-[#F99D1C]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-bold text-[18px] text-slate-900 leading-none", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";
