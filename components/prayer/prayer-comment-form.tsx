"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addPrayerComment } from "@/actions/prayer";
import { Button } from "@/components/ui/button";

type Props = {
  prayerRequestId: string;
  isAuthenticated: boolean;
};

export function PrayerCommentForm({ prayerRequestId, isAuthenticated }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border px-4 py-4">
        <Link
          href={`/auth/login?next=/prayer/${prayerRequestId}`}
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>{" "}
        to leave encouragement.
      </p>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setLoading(true);
        setError(null);
        const res = await addPrayerComment(prayerRequestId, body.trim());
        setLoading(false);
        if (res?.error) setError(res.error);
        else {
          setBody("");
          router.refresh();
        }
      }}
      className="space-y-3"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Leave a word of encouragement or scripture…"
        rows={3}
        maxLength={2000}
        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-base"
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={loading} className="rounded-full">
        {loading ? "Posting…" : "Post encouragement"}
      </Button>
    </form>
  );
}
