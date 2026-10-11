import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  indicatorClassName?: string;
}

export function Progress({ value, className, indicatorClassName }: ProgressProps) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-slate-800", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-100 ease-linear", indicatorClassName)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
