import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full items-center justify-center truncate rounded-full border font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-white/15 bg-muted/80 px-3 py-1 text-xs text-foreground backdrop-blur-xl",
        status:
          "border-black/60 bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-xl",
        gradient:
          "border-transparent bg-gradient-to-r from-menarium-teal/80 to-menarium-purple/80 px-3 py-1 text-xs text-white backdrop-blur-xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
