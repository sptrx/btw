"use client";

import { useEffect, useRef, useState } from "react";
import { streamPlayerUrl, streamThumbnailUrl } from "@/lib/stream-urls";

/** Stream iframe player. Autoplays (muted) only while mostly on screen. */
export function ShortPlayer({
  uid,
  controls = false,
  className = "",
}: {
  uid: string;
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

  const src = visible ? streamPlayerUrl(uid, { autoplay: true }) : null;
  const poster = streamThumbnailUrl(uid);

  return (
    <div ref={ref} className={`relative aspect-[9/16] w-full overflow-hidden bg-black ${className}`}>
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : null}
      {src ? (
        <iframe
          src={controls ? src : `${src}&controls=false`}
          title="Short video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : null}
    </div>
  );
}
