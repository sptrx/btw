"use client";

import { useState } from "react";
import Link from "next/link";
import { createPrayerRequest } from "@/actions/prayer";
import {
  ContentSubmissionDisclaimer,
  ContentSubmissionDisclaimerAccepted,
} from "@/components/content-submission-disclaimer";
import { ContentMissionHint } from "@/components/content-mission-hint";
import { Button } from "@/components/ui/button";

type Props = {
  hasAlreadyAcceptedDisclaimer?: boolean;
};

export function PrayerRequestForm({
  hasAlreadyAcceptedDisclaimer = false,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const effectiveAccepted = hasAlreadyAcceptedDisclaimer || acceptedDisclaimer;

  return (
    <form
      action={async (formData) => {
        setLoading(true);
        setError(null);
        setInfo(null);
        if (!effectiveAccepted) {
          setError("Please accept the content disclaimer before submitting.");
          setLoading(false);
          return;
        }
        if (effectiveAccepted && !hasAlreadyAcceptedDisclaimer) {
          formData.set("accepted_disclaimer", "1");
        } else if (hasAlreadyAcceptedDisclaimer) {
          formData.set("accepted_disclaimer", "1");
        }
        const res = await createPrayerRequest(formData);
        setLoading(false);
        if (res?.error) setError(res.error);
        else if (res?.pendingReview && res.message) setInfo(res.message);
      }}
      className="space-y-6"
    >
      <ContentMissionHint variant="default" />
      <div className="space-y-2">
        <label htmlFor="prayer-title" className="text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="prayer-title"
          name="title"
          type="text"
          required
          maxLength={200}
          placeholder="Brief summary of your prayer need"
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-base"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="prayer-body" className="text-sm font-medium text-foreground">
          Prayer request
        </label>
        <textarea
          id="prayer-body"
          name="body"
          required
          rows={8}
          maxLength={5000}
          placeholder="Share what you would like the community to pray for…"
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-base"
        />
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 px-4 py-3 cursor-pointer">
        <input
          type="checkbox"
          name="is_anonymous"
          className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
        />
        <span className="text-sm text-muted-foreground leading-relaxed">
          Post anonymously — your name will show as &ldquo;A sister/brother in Christ&rdquo; to
          others.
        </span>
      </label>
      {hasAlreadyAcceptedDisclaimer ? (
        <ContentSubmissionDisclaimerAccepted />
      ) : (
        <ContentSubmissionDisclaimer
          id="prayer-disclaimer"
          checked={acceptedDisclaimer}
          onCheckedChange={setAcceptedDisclaimer}
        />
      )}
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
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading} className="rounded-full">
          {loading ? "Submitting…" : "Submit prayer request"}
        </Button>
        <Button type="button" variant="outline" asChild className="rounded-full">
          <Link href="/prayer">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
