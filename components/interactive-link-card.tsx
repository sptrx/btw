"use client";

import Link from "next/link";
import { useRef } from "react";
import { usePointerTilt } from "@/hooks/use-pointer-tilt";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
};

/**
 * Channel / browse cards: same elevated surface + pointer tilt language as featured carousel, tuned subtler for lists.
 */
export function InteractiveLinkCard({ href, className, innerClassName, children }: Props) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  usePointerTilt(linkRef, tiltRef, { maxRotateX: 5, maxRotateY: 7 });

  return (
    <Link
      ref={linkRef}
      href={href}
      className={cn(
        "group block touch-manipulation rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "[perspective:1000px]",
        className
      )}
    >
      <div
        ref={tiltRef}
        className={cn(
          "btw-surface btw-surface-interactive h-full min-h-[4.5rem] w-full overflow-hidden p-4 sm:p-5 transform-gpu will-change-transform",
          innerClassName
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </div>
    </Link>
  );
}
