import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-14 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 text-center text-xl text-slate-50 placeholder:text-slate-500 shadow-inner transition focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
