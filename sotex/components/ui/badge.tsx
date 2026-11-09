"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-on-primary",
        secondary: "border-transparent bg-secondary text-on-secondary font-medium",
        destructive: "border-transparent bg-error/15 text-error font-bold",
        success: "border-transparent bg-emerald-50 text-emerald-700 font-bold",
        warning: "border-transparent bg-amber-50 text-amber-700 font-bold",
        info: "border-transparent bg-secondary/10 text-secondary font-bold border border-secondary/20",
        outline: "border border-outline-variant/60 text-on-surface",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

