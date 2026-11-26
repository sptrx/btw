"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { prepareWitnessChannel, publishWitnessPost } from "@/actions/channels";
import {
  ContentSubmissionDisclaimer,
  ContentSubmissionDisclaimerAccepted,
} from "@/components/content-submission-disclaimer";
import { MediaUploadField, type MediaItem } from "@/components/media-upload-field";
import { PendingReviewNotice } from "@/components/pending-review-notice";
import { PostPromptPicker } from "@/components/post-prompt-picker";
import { ShortUploadForm } from "@/components/shorts/short-upload-form";
import { Button } from "@/components/ui/button";
import { SHARING_TYPE_CONFIG, type SharingType } from "@/lib/sharing-types";

const DRAFT_KEY = "btw-witness-draft";
const fieldClass =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";

type Format = "topic" | "pictures" | "short";

const FORMATS: { id: Format; label: string }[] = [
  { id: "topic", label: "Topic" },
  { id: "pictures", label: "Pictures" },
  { id: "short", label: "Short" },
];

const TOPIC_KINDS: SharingType[] = [
  "testimony",
  "revelation",
  "prophecy",
  "discussion",
  "question",
  "devotional",
  "praise_report",
];

type Draft = { format: Format; sharingType: SharingType; title: string; body: string };

function isFormat(value: unknown): value is Format {
  return value === "topic" || value === "pictures" || value === "short";
}

function isKind(value: unknown): value is SharingType {
  return typeof value === "string" && TOPIC_KINDS.includes(value as SharingType);
}

function readDraft(): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft> & { title?: string; body?: string };
    if (typeof parsed.title !== "string" || typeof parsed.body !== "string") return null;
    return {
      format: isFormat(parsed.format) ? parsed.format : "topic",
      sharingType: isKind(parsed.sharingType) ? parsed.sharingType : "testimony",
      title: parsed.title,
      body: parsed.body,
    };
  } catch {
    return null;
  }
}

export function WitnessPostForm({
  isAuthenticated,
  hasAlreadyAcceptedDisclaimer,
}: {
  isAuthenticated: boolean;
  hasAlreadyAcceptedDisclaimer: boolean;
}) {
  const router = useRouter();
  const [format, setFormat] = useState<Format>("topic");
  const [sharingType, setSharingType] = useState<SharingType>("testimony");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [publishedHref, setPublishedHref] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;
    setFormat(draft.format);
    setSharingType(draft.sharingType);
    setTitle(draft.title);
    setBody(draft.body);
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || format !== "pictures" || channelId) return;
    let cancelled = false;
    void prepareWitnessChannel().then((result) => {
      if (cancelled) return;
      if ("channelId" in result) setChannelId(result.channelId);
      else if ("error" in result) setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, format, channelId]);

  function saveDraft() {
    const draft: Draft = {
      format,
      sharingType,
      title: title.trim(),
      body: body.trim(),
    };
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function goSignUp() {
    saveDraft();
    router.push("/auth/signup?next=/post/new");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (format === "short") {
      if (!isAuthenticated) goSignUp();
      return;
    }
    if (!title.trim()) {
      setError("Add a title for your post.");
      return;
    }
    if (format === "topic" && !body.trim()) {
      setError("Write the post before publishing.");
      return;
    }
    if (format === "pictures" && media.length === 0) {
      setError(isAuthenticated ? "Add at least one picture." : "Sign up to add pictures.");
      if (!isAuthenticated) goSignUp();
      return;
    }
    if (!isAuthenticated) {
      goSignUp();
      return;
    }
    if (!hasAlreadyAcceptedDisclaimer && !acceptedDisclaimer) {
      setError("Please accept the content disclaimer before publishing.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("format", format);
      formData.set("sharing_type", sharingType);
      formData.set("title", title.trim());
      formData.set("body", body.trim());
      formData.set("media_urls", JSON.stringify(media.filter((item) => item.type === "image" && item.url)));
      formData.set("accepted_disclaimer", hasAlreadyAcceptedDisclaimer || acceptedDisclaimer ? "1" : "0");
      const result = await publishWitnessPost(formData);
      if ("needsAuth" in result) {
        goSignUp();
        return;
      }
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.sessionStorage.removeItem(DRAFT_KEY);
      if (result.pendingReview) {
        setPendingMessage(result.message ?? "");
        setPublishedHref(result.href);
        return;
      }
      router.push(result.href);
    } finally {
      setSubmitting(false);
    }
  }

  const kind = SHARING_TYPE_CONFIG[sharingType];
  const pictures = media.filter((item) => item.type === "image" && item.url);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="What are you posting?">
        {FORMATS.map((item) => {
          const selected = format === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setFormat(item.id);
                setError(null);
              }}
              className={
                "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors " +
                (selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted")
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {restored && isAuthenticated ? (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          Your post is saved on this device. Sign-up is done, so you can publish it now.
        </p>
      ) : null}
      {pendingMessage ? <PendingReviewNotice message={pendingMessage} /> : null}
      {publishedHref ? (
        <Link href={publishedHref} className="inline-flex text-sm font-medium text-primary hover:underline">
          Open your channel
        </Link>
      ) : null}

      {format === "short" ? (
        isAuthenticated ? (
          <ShortUploadForm />
        ) : (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 px-4 py-4">
            <p className="text-sm leading-relaxed text-foreground">
              A short is a video up to 90 seconds. Sign up, then come back to upload it. It goes live after a short review.
            </p>
            <Button type="button" onClick={goSignUp} className="rounded-full px-6">
              Sign up to post
            </Button>
          </div>
        )
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">What kind of post is this?</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Kind of post">
              {TOPIC_KINDS.map((value) => {
                const selected = sharingType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSharingType(value)}
                    className={
                      "min-h-9 rounded-full border px-3 text-sm transition-colors " +
                      (selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground")
                    }
                  >
                    {value === "devotional" ? "Sermon" : SHARING_TYPE_CONFIG[value].shortLabel}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              {sharingType === "devotional"
                ? "A sermon thought, a verse, and how to live it."
                : kind.description}
            </p>
          </div>

          {format === "topic" ? (
            <PostPromptPicker
              sharingType={sharingType}
              visible={!title.trim() && !body.trim()}
              onPick={(prompt) => {
                setTitle(prompt.title);
                setBody(prompt.body);
              }}
            />
          ) : null}

          <div className="space-y-2">
            <label htmlFor="witness-title" className="text-sm font-medium text-foreground">
              Title
            </label>
            <input
              id="witness-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              placeholder={kind.placeholder || "What God did"}
              className={fieldClass}
            />
          </div>

          {format === "pictures" ? (
            <div className="space-y-3">
              {isAuthenticated && channelId ? (
                <MediaUploadField channelId={channelId} mediaUrls={pictures} onMediaChange={setMedia} imagesOnly />
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  {isAuthenticated
                    ? "Opening a place for your pictures…"
                    : "Sign up to add pictures. Your title stays on this device."}
                </p>
              )}
              {pictures.length > 0 ? (
                <ul className="grid grid-cols-3 gap-2">
                  {pictures.map((item) => (
                    <li key={item.url} className="overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt="" className="aspect-square w-full object-cover" />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="witness-body" className="text-sm font-medium text-foreground">
              {format === "pictures" ? "A note (optional)" : "Your words"}
            </label>
            <textarea
              id="witness-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={format === "pictures" ? 4 : 8}
              maxLength={8000}
              placeholder={format === "pictures" ? "Say what the picture means." : kind.placeholder || "Tell it in your own words."}
              className={fieldClass}
            />
          </div>

          {isAuthenticated ? (
            hasAlreadyAcceptedDisclaimer ? (
              <ContentSubmissionDisclaimerAccepted />
            ) : (
              <ContentSubmissionDisclaimer
                id="witness-disclaimer"
                checked={acceptedDisclaimer}
                onCheckedChange={setAcceptedDisclaimer}
              />
            )
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Write it here. Sign up to publish, and your words stay on this device.
            </p>
          )}
          {error ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={submitting || Boolean(publishedHref)} className="rounded-full px-6">
            {submitting ? "Publishing..." : isAuthenticated ? "Publish" : "Post it"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Prayer requests belong on the{" "}
            <Link href="/prayer/new" className="font-medium text-primary hover:underline">
              prayer wall
            </Link>
            .
          </p>
        </form>
      )}
    </div>
  );
}
