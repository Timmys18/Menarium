import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconContainerVariants = cva(
  "inline-flex shrink-0 items-center justify-center",
  {
    variants: {
      size: {
        sm: "size-6 rounded-lg [&_svg]:size-3.5",
        md: "size-12 rounded-2xl [&_svg]:size-6",
        lg: "size-16 rounded-[20px] [&_svg]:size-8",
      },
      variant: {
        default:
          "bg-gradient-to-br from-menarium-teal/20 to-menarium-purple/20 text-menarium-purple",
        gradient:
          "bg-gradient-to-br from-menarium-teal to-menarium-cyan text-white shadow-glow-teal",
        glass: "glass-card text-white/90",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

export interface IconContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconContainerVariants> {}

export const IconContainer = React.forwardRef<
  HTMLDivElement,
  IconContainerProps
>(({ className, size, variant, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(iconContainerVariants({ size, variant }), className)}
      {...props}
    >
      {children}
    </div>
  );
});
IconContainer.displayName = "IconContainer";
