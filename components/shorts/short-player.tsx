"use client";

import { useEffect, useRef, useState } from "react";

/** Stream iframe player. Autoplays (muted) only while mostly on screen. */
export function ShortPlayer({
  playerUrl,
  posterUrl,
  controls = false,
  className = "",
}: {
  playerUrl: string | null;
  posterUrl: string | null;
  controls?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio >= 0.6), {
      threshold: [0, 0.6, 1],
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Reviewers get the player straight away (with controls); the feed waits until it's on screen.
  const show = playerUrl && (controls || visible);
  const src = show ? `${playerUrl}${controls ? "" : "&autoplay=true&controls=false"}` : null;

  return (
    <div
      ref={ref}
      className={`relative aspect-[9/16] max-h-[70vh] w-full overflow-hidden rounded-t-2xl bg-black ${className}`}
    >
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : null}
      {src ? (
        <iframe
          src={src}
          title="Short video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : null}
      {!playerUrl ? (
        <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-white/80">
          Video preview isn&apos;t configured yet.
        </p>
      ) : null}
    </div>
  );
}
