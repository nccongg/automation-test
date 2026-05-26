import * as React from "react"
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-bold tracking-[0.03125rem] transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(180deg,#60a5fa_0%,#2563eb_100%)] text-white border border-white/30 shadow-[0px_4px_14px_rgba(0,0,0,0.2)] hover:brightness-105 active:brightness-95",
        destructive:
          "bg-destructive text-white shadow-[0px_4px_14px_rgba(0,0,0,0.2)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-primary bg-surface text-primary shadow-[0px_2px_8px_rgba(0,0,0,0.2)] hover:bg-primary/5",
        secondary:
          "bg-surface text-foreground shadow-[0px_4px_14px_rgba(0,0,0,0.2)] hover:bg-surface-2",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        "ds-cta":
          "bg-[linear-gradient(180deg,#B4F5DC_0%,#7CECC1_100%)] text-[#017C28] border border-white/50 shadow-[0px_4px_14px_rgba(0,0,0,0.2)] hover:brightness-95",
        "ds-outlined-success":
          "border border-success text-success bg-surface shadow-[0px_2px_8px_rgba(0,0,0,0.2)] hover:bg-success/5",
        "ds-outlined-destructive":
          "border border-destructive text-destructive bg-surface shadow-[0px_2px_8px_rgba(0,0,0,0.2)] hover:bg-destructive/5",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-[4px] px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-[50px] px-8 has-[>svg]:px-6 text-base",
        icon: "size-9",
        "icon-xs": "size-6 rounded-[4px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
