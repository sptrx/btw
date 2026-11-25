"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { reviewShort } from "@/actions/shorts";
import { ShortPlayer } from "@/components/shorts/short-player";
import { Button } from "@/components/ui/button";
import type { ShortItem } from "@/lib/shorts-types";

export function ShortsReviewList({ items }: { items: ShortItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, decision: "approve" | "reject") {
    const reason = decision === "reject" ? window.prompt("Reason (shown to the author, optional):") ?? undefined : undefined;
    setBusy(id);
    setError(null);
    const res = await reviewShort(id, decision, reason);
    setBusy(null);
    if ("error" in res) return setError(res.error);
    router.refresh();
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No shorts waiting for review.
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((s) => (
          <li key={s.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            {s.streamUid ? <ShortPlayer uid={s.streamUid} controls /> : null}
            <div className="space-y-2 p-4">
              <p className="text-xs text-muted-foreground">
                {s.authorName}
                {s.durationSeconds ? ` · ${Math.round(s.durationSeconds)}s` : ""}
              </p>
              {s.caption ? <p className="text-sm">{s.caption}</p> : null}
              <div className="flex gap-2">
                <Button size="sm" disabled={busy === s.id} onClick={() => void decide(s.id, "approve")}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" disabled={busy === s.id} onClick={() => void decide(s.id, "reject")}>
                  Reject
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
