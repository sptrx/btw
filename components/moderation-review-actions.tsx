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
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const runApprove = async () => {
    setLoading("approve");
    setError(null);
    const res = await approveModeratedContent(contentId);
    setLoading(null);
    if (!res || "error" in res) {
      setError(res?.error ?? "Action failed.");
      return;
    }
    router.refresh();
  };

  const runReject = async () => {
    setLoading("reject");
    setError(null);
    const res = await rejectModeratedContent(contentId, rejectNote);
    setLoading(null);
    if (!res || "error" in res) {
      setError(res?.error ?? "Action failed.");
      return;
    }
    setShowRejectForm(false);
    setRejectNote("");
    router.refresh();
  };

  return (
    <div className="flex w-full min-w-[14rem] flex-col gap-3 lg:w-auto lg:min-w-[18rem]">
      {!showRejectForm ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            size="sm"
            disabled={loading !== null}
            onClick={runApprove}
            className="min-h-9"
          >
            {loading === "approve" ? "Approving…" : "Approve"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading !== null}
            onClick={() => {
              setError(null);
              setShowRejectForm(true);
            }}
            className="min-h-9"
          >
            Reject
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
          <div>
            <label htmlFor={`reject-note-${contentId}`} className="block text-xs font-medium text-foreground">
              Note to author (optional)
            </label>
            <textarea
              id={`reject-note-${contentId}`}
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Please add more personal testimony about how God met you in this season."
              maxLength={1000}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 btw-meta">
              Shown on the post and in the author&apos;s notification.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={loading !== null}
              onClick={runReject}
              className="min-h-9"
            >
              {loading === "reject" ? "Rejecting…" : "Confirm reject"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={loading !== null}
              onClick={() => {
                setShowRejectForm(false);
                setRejectNote("");
                setError(null);
              }}
              className="min-h-9"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
