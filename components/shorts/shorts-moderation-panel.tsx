"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { reviewShort } from "@/actions/shorts";
import { ShortPlayer } from "@/components/shorts/short-player";
import { Button } from "@/components/ui/button";
import { RelativeDate } from "@/components/relative-date";
import { SHORT_STATUS_LABEL, type ShortItem, type ShortStatus } from "@/lib/shorts-types";

type Tab = "pending" | "approved" | "rejected" | "processing";

const TABS: { id: Tab; label: string; statuses: ShortStatus[] }[] = [
  { id: "pending", label: "Waiting", statuses: ["pending_review"] },
  { id: "approved", label: "Approved", statuses: ["approved"] },
  { id: "rejected", label: "Rejected", statuses: ["rejected"] },
  { id: "processing", label: "Processing", statuses: ["uploading", "processing", "failed"] },
];

export function ShortsModerationPanel({ items }: { items: ShortItem[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = {} as Record<Tab, number>;
    for (const t of TABS) map[t.id] = items.filter((i) => t.statuses.includes(i.status)).length;
    return map;
  }, [items]);

  const shown = items.filter((i) => TABS.find((t) => t.id === tab)!.statuses.includes(i.status));

  async function decide(id: string, decision: "approve" | "reject" | "requeue") {
    let reason: string | undefined;
    if (decision === "reject") {
      const entered = window.prompt("Reason (shown to the author, optional):");
      if (entered === null) return;
      reason = entered;
    }
    setBusy(id);
    setError(null);
    const res = await reviewShort(id, decision, reason);
    setBusy(null);
    if ("error" in res) return setError(res.error);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              tab === t.id
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {t.label}
            <span className="ml-1.5 tabular-nums">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Nothing here right now.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((s) => (
            <li key={s.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <ShortPlayer playerUrl={s.playerUrl} posterUrl={s.posterUrl} controls eager className="rounded-t-2xl" />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-xs text-muted-foreground">
                  {s.authorName}
                  {s.durationSeconds ? ` · ${Math.round(s.durationSeconds)}s` : ""}
                  {" · "}
                  <RelativeDate date={s.createdAt} className="tabular-nums" />
                </p>
                {s.caption ? <p className="text-sm">{s.caption}</p> : null}
                <p className="text-xs text-muted-foreground">
                  {SHORT_STATUS_LABEL[s.status]}
                  {s.reviewerName ? ` by ${s.reviewerName}` : ""}
                  {s.status === "rejected" && s.rejectionReason ? ` — ${s.rejectionReason}` : ""}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  {s.status !== "approved" && s.status !== "uploading" && s.status !== "processing" ? (
                    <Button size="sm" disabled={busy === s.id} onClick={() => void decide(s.id, "approve")}>
                      Approve
                    </Button>
                  ) : null}
                  {s.status === "pending_review" || s.status === "approved" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === s.id}
                      onClick={() => void decide(s.id, "reject")}
                    >
                      {s.status === "approved" ? "Take down" : "Reject"}
                    </Button>
                  ) : null}
                  {s.status === "approved" || s.status === "rejected" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === s.id}
                      onClick={() => void decide(s.id, "requeue")}
                    >
                      Back to review
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
