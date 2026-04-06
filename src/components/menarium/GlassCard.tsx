import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassCardVariants = cva("rounded-3xl border border-white/10 text-card-foreground", {
  variants: {
    variant: {
      base: "glass-card",
      hover: "glass-card glass-card-hover",
    },
  },
  defaultVariants: {
    variant: "base",
  },
});

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";
