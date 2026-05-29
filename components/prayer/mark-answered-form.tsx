"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markPrayerAnswered } from "@/actions/prayer";
import { Button } from "@/components/ui/button";

type Props = {
  prayerRequestId: string;
};

export function MarkAnsweredForm({ prayerRequestId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        Mark as Answered
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-4 space-y-3">
      <p className="text-sm font-medium text-foreground">
        Share how God answered — this becomes a Praise Report for the community.
      </p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Tell us how God moved in this situation…"
        rows={4}
        maxLength={5000}
        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-muted-foreground" role="status">
          {info}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={loading || !body.trim()}
          className="rounded-full"
          onClick={async () => {
            setLoading(true);
            setError(null);
            setInfo(null);
            const res = await markPrayerAnswered(prayerRequestId, body);
            setLoading(false);
            if (res?.error) setError(res.error);
            else if (res?.pendingReview && res.message) {
              setInfo(res.message);
            } else {
              setOpen(false);
              router.refresh();
            }
          }}
        >
          {loading ? "Saving…" : "Publish Praise Report"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
