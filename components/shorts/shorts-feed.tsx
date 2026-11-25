"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { listApprovedShorts } from "@/actions/shorts";
import { ShortPlayer } from "@/components/shorts/short-player";
import type { ShortItem } from "@/lib/shorts-types";

export function ShortsFeed({
  initial,
  initialCursor,
}: {
  initial: ShortItem[];
  initialCursor: string | null;
}) {
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const more = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const next = await listApprovedShorts(cursor);
      setItems((prev) => [...prev, ...next.items.filter((n) => !prev.some((p) => p.id === n.id))]);
      setCursor(next.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && void more(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, more]);

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No shorts yet. Be the first to share a testimony in under 90 seconds.
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      {items.map((s) => (
        <article key={s.id} className="overflow-hidden rounded-2xl border border-border bg-card">
          {s.streamUid ? <ShortPlayer uid={s.streamUid} /> : null}
          <div className="space-y-1 p-4">
            <p className="text-sm font-medium">
              {s.authorUsername ? (
                <Link href={`/u/${s.authorUsername}`} className="hover:underline">
                  {s.authorName}
                </Link>
              ) : (
                s.authorName
              )}
            </p>
            {s.caption ? <p className="text-sm text-muted-foreground">{s.caption}</p> : null}
          </div>
        </article>
      ))}
      <div ref={sentinel} aria-hidden className="h-1" />
      {loading ? <p className="text-center text-sm text-muted-foreground">Loading…</p> : null}
    </div>
  );
}
