"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveModeratedContent, rejectModeratedContent } from "@/actions/moderation-admin";
import { Button } from "@/components/ui/button";

type Props = {
  contentId: string;
};

export function ModerationReviewActions({ contentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: "approve" | "reject") => {
    setLoading(action);
    setError(null);
    const res =
      action === "approve"
        ? await approveModeratedContent(contentId)
        : await rejectModeratedContent(contentId);
    setLoading(null);
    if (!res || "error" in res) {
      setError(res?.error ?? "Action failed.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button
        type="button"
        size="sm"
        disabled={loading !== null}
        onClick={() => run("approve")}
        className="min-h-9"
      >
        {loading === "approve" ? "Approving…" : "Approve"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading !== null}
        onClick={() => run("reject")}
        className="min-h-9"
      >
        {loading === "reject" ? "Rejecting…" : "Reject"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
