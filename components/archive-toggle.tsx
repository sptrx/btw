"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Result = { error?: string; ok?: boolean } | undefined;

type Props = {
  archived: boolean;
  /** "channel" or "page" — used in the wording */
  kind: "channel" | "page";
  onArchive: () => Promise<Result>;
  onUnarchive: () => Promise<Result>;
  /** Hide the explanatory paragraph (used in the banner) */
  compact?: boolean;
};

/** Archive / restore button with inline error handling. */
export function ArchiveToggle({ archived, kind, onArchive, onUnarchive, compact }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await (archived ? onUnarchive() : onArchive());
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      {!compact && (
        <p className="text-sm text-muted-foreground">
          {archived
            ? `This ${kind} is archived: only you can see it. Restore it to make it public again.`
            : `Archiving hides this ${kind}${kind === "channel" ? ", its pages" : ""} and its posts from everyone else. Nothing is deleted and you can restore it any time.`}
        </p>
      )}
      <Button
        type="button"
        variant={archived ? "default" : "outline"}
        onClick={run}
        disabled={pending}
        className="min-h-11 w-full touch-manipulation sm:w-auto"
      >
        {pending
          ? archived
            ? "Restoring…"
            : "Archiving…"
          : archived
            ? `Restore ${kind}`
            : `Archive ${kind}`}
      </Button>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
