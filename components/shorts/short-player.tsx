"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  playerUrl: string | null;
  posterUrl: string | null;
  /** Show Stream's own controls (play, pause, unmute). */
  controls?: boolean;
  /** Load the player straight away instead of waiting until it scrolls into view. */
  eager?: boolean;
  className?: string;
};

/**
 * Stream iframe player. By default it shows the poster until the video is mostly
 * on screen, then loads and plays it muted — so a feed of shorts stays light.
 */
export function ShortPlayer({ playerUrl, posterUrl, controls = false, eager = false, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (eager) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio >= 0.6), {
      threshold: [0, 0.6, 1],
    });
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  const load = Boolean(playerUrl) && (eager || visible);
  const src = load
    ? `${playerUrl}${controls ? "" : "&controls=false"}${eager ? "" : "&autoplay=true"}`
    : null;

  return (
    <div
      ref={ref}
      className={`relative aspect-[9/16] max-h-[70vh] w-full overflow-hidden bg-black ${className}`}
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
