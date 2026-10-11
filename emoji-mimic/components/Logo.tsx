import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** light: koyu arka plan için (beyaz yazı), dark: açık arka plan için */
  variant?: "light" | "dark";
}

export function Logo({ className, variant = "light" }: LogoProps) {
  return (
    <img
      src={variant === "light" ? "/hsd-maku-logo-light.png" : "/hsd-maku-logo.png"}
      alt="Huawei Student Developers MAKÜ"
      draggable={false}
      className={cn("h-10 w-auto select-none", className)}
    />
  );
}
