"use client";

import Link from "next/link";

type Props = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Shorter copy for comments; full copy for posts. */
  variant?: "default" | "compact";
};

/**
 * Compact reminder shown in place of the checkbox once the user has previously
 * agreed to the disclaimer. Keeps the disclaimer link visible without forcing
 * them to re-check the box on every submission (acceptance is stored on the
 * profile -- see migration 20260513030000_profile_disclaimer_acceptance.sql).
 */
export function ContentSubmissionDisclaimerAccepted({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const isCompact = variant === "compact";
  return (
    <p
      className={
        isCompact
          ? "text-xs text-muted-foreground"
          : "text-xs text-muted-foreground"
      }
    >
      You previously agreed to the{" "}
      <Link
        href="/legal/content-disclaimer"
        className="text-primary font-medium underline-offset-2 hover:underline"
      >
        content disclaimer
      </Link>
      .
    </p>
  );
}

export function ContentSubmissionDisclaimer({
  id,
  checked,
  onCheckedChange,
  variant = "default",
}: Props) {
  const isCompact = variant === "compact";

  return (
    <div
      className={
        isCompact
          ? "rounded-lg border border-border bg-muted/25 px-3 py-3 text-sm"
          : "rounded-xl border border-border bg-muted/30 px-4 py-4 space-y-3"
      }
    >
      {!isCompact && (
        <p className="text-sm font-medium text-foreground">Before you publish</p>
      )}
      <p className={isCompact ? "text-xs text-muted-foreground mb-2" : "text-sm text-muted-foreground leading-relaxed"}>
        {isCompact ? (
          <>
            Comments are public. You are responsible for what you post. See our{" "}
            <Link href="/legal/content-disclaimer" className="text-primary font-medium underline-offset-2 hover:underline">
              content disclaimer
            </Link>{" "}
            for details.
          </>
        ) : (
          <>
            By publishing, you confirm you have the right to share this material, that it is respectful and lawful, and
            that it aligns with our community purpose. Content may be moderated or removed. See the full{" "}
            <Link href="/legal/content-disclaimer" className="text-primary font-medium underline-offset-2 hover:underline">
              content disclaimer
            </Link>
            .
          </>
        )}
      </p>
      <label
        className={
          isCompact
            ? "flex cursor-pointer items-start gap-2.5 text-sm text-foreground"
            : "flex cursor-pointer items-start gap-3 text-sm text-foreground"
        }
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary rounded border-input"
        />
        <span>
          I have read and agree to the{" "}
          <Link href="/legal/content-disclaimer" className="text-primary font-medium underline-offset-2 hover:underline">
            content disclaimer
          </Link>{" "}
          for this submission.
        </span>
      </label>
    </div>
  );
}
