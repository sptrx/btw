"use client";

import { useEffect, useState } from "react";
import { POST_SLOGANS } from "@/lib/post-slogans";

type Props = {
  as?: "h1" | "h2";
  className?: string;
  supportClassName?: string;
  /** Milliseconds between lines. */
  intervalMs?: number;
};

/** Cycles invitation lines. The first paint always uses the first line so the server and browser match. */
export function RotatingSlogan({
  as: Tag = "h2",
  className,
  supportClassName,
  intervalMs = 7000,
}: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % POST_SLOGANS.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  const slogan = POST_SLOGANS[index] ?? POST_SLOGANS[0];

  return (
    <div>
      <Tag className={className} aria-live="polite">
        {slogan.line}
      </Tag>
      <p className={supportClassName}>{slogan.support}</p>
    </div>
  );
}
