import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LinkButtonProps {
  href: string;
  variant: "primary" | "secondary";
  children: ReactNode;
  className?: string;
}

/** Ссылка в виде кнопки в стиле Menarium DS (подходит для Server Components). */
export function LinkButton({ href, variant, children, className }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
        variant === "primary" &&
          "rounded-2xl bg-gradient-to-r from-menarium-teal to-menarium-purple px-10 py-5 text-lg text-white shadow-glow-purple hover:brightness-110",
        variant === "secondary" &&
          "glass-card rounded-2xl px-10 py-5 text-lg text-white hover:bg-white/10",
        className
      )}
    >
      {children}
    </Link>
  );
}
