"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const menariumButtonVariants = cva(
  "inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "rounded-2xl bg-gradient-to-r from-menarium-teal to-menarium-purple text-white shadow-glow-purple hover:brightness-110 active:scale-[0.98]",
        secondary:
          "glass-card rounded-2xl text-white hover:bg-white/10 active:scale-[0.98]",
        ghost:
          "rounded-2xl text-white/70 hover:bg-white/5 hover:text-white active:scale-[0.98]",
        icon: "glass-card shrink-0 text-white/80 hover:bg-white/10 hover:text-white active:scale-95",
      },
      size: {
        sm: "text-base gap-2",
        md: "text-lg gap-2",
        lg: "text-lg gap-2",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        size: "sm",
        class: "px-6 py-3",
      },
      {
        variant: "primary",
        size: "md",
        class: "px-8 py-4",
      },
      {
        variant: "primary",
        size: "lg",
        class: "px-10 py-5",
      },
      {
        variant: "secondary",
        size: "sm",
        class: "px-6 py-3",
      },
      {
        variant: "secondary",
        size: "md",
        class: "px-8 py-4",
      },
      {
        variant: "secondary",
        size: "lg",
        class: "px-10 py-5",
      },
      {
        variant: "ghost",
        size: "sm",
        class: "px-4 py-2 text-sm font-medium",
      },
      {
        variant: "ghost",
        size: "md",
        class: "px-5 py-2.5 text-base font-medium",
      },
      {
        variant: "ghost",
        size: "lg",
        class: "px-6 py-3 text-base font-medium",
      },
      {
        variant: "icon",
        size: "sm",
        class: "h-10 w-10 rounded-full p-0 [&_svg]:size-5",
      },
      {
        variant: "icon",
        size: "md",
        class: "h-12 w-12 rounded-full p-0 [&_svg]:size-6",
      },
      {
        variant: "icon",
        size: "lg",
        class: "h-16 w-16 rounded-full p-0 [&_svg]:size-8",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface MenariumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof menariumButtonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, MenariumButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(menariumButtonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "MenariumButton";
