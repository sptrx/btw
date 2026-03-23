"use client";

import Link from "next/link";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

export function MovingBorderLink({ href, children, variant = "primary", className }: Props) {
  return (
    <MovingBorderButton
      as={Link}
      href={href}
      containerClassName={cn("h-11 w-auto min-w-[9rem] px-6 text-sm font-medium", className)}
      className={cn(
        "font-medium",
        variant === "primary"
          ? "border-border bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-border bg-background text-foreground hover:bg-muted"
      )}
      borderClassName="bg-primary/30 dark:bg-primary/50"
    >
      {children}
    </MovingBorderButton>
  );
}
