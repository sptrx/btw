"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { updateContent } from "@/actions/channels";
import { Button } from "@/components/ui/button";
import { MediaUploadField, type MediaItem } from "@/components/media-upload-field";
import {
  ContentSubmissionDisclaimer,
  ContentSubmissionDisclaimerAccepted,
} from "@/components/content-submission-disclaimer";
import { TopicTagPicker } from "@/components/tags/topic-tag-picker";

const CONTENT_TYPES = [
  { value: "video", label: "Video" },
  { value: "podcast", label: "Podcast" },
  { value: "article", label: "Article" },
  { value: "discussion", label: "Discussion" },
] as const;

type Page = { id: string; slug: string; title: string };
type Tag = { id: string; slug: string; label: string };

type Content = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  page_id: string | null;
  media_urls: unknown;
  is_featured?: boolean | null;
};

type Props = {
  channelId: string;
  channelSlug: string;
  content: Content;
  pages: Page[];
  allTags: Tag[];
  initialTagIds: string[];
  /** True once the user has agreed to the disclaimer at least once -- hides
   *  the per-edit checkbox below. */
  hasAlreadyAcceptedDisclaimer?: boolean;
};

export default function EditContentForm({
  channelId,
  channelSlug,
  content,
  pages,
  allTags,
  initialTagIds,
  hasAlreadyAcceptedDisclaimer = false,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const initialMedia = (content.media_urls as MediaItem[] | null) ?? [];
  const [mediaUrls, setMediaUrls] = useState<MediaItem[]>(
    Array.isArray(initialMedia) ? initialMedia.filter((m) => m?.url) : []
  );
  const [pageId, setPageId] = useState(content.page_id ?? pages[0]?.id ?? "");
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const router = useRouter();

  const effectiveAccepted = hasAlreadyAcceptedDisclaimer || acceptedDisclaimer;

  const addMedia = () => setMediaUrls([...mediaUrls, { url: "", type: "image" }]);
  const updateMedia = (i: number, field: string, value: string) => {
    const next = [...mediaUrls];
    (next[i] as Record<string, string>)[field] = value;
    setMediaUrls(next);
  };

  return (
    <form
      action={async (formData) => {
        setError(null);
        if (!effectiveAccepted) {
          setError("Please read and accept the content disclaimer before saving.");
          return;
        }
        const targetPage = pageId || pages[0]?.id;
        if (!targetPage) {
          setError("Select a page first.");
          return;
        }
        formData.set("media_urls", JSON.stringify(mediaUrls.filter((m) => m.url)));
        formData.set("page_id", targetPage);
        formData.set("accepted_disclaimer", effectiveAccepted ? "1" : "0");
        const res = await updateContent(content.id, formData);
        if (res?.error) setError(res.error);
      }}
      className="max-w-xl space-y-6"
    >
      <div>
        <label htmlFor="edit-content-page" className="block text-sm font-medium mb-1">
          Page
        </label>
        <select
          id="edit-content-page"
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-sm"
        >
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="edit-content-type" className="block text-sm font-medium mb-1">
          Content type
        </label>
        <select
          id="edit-content-type"
          name="type"
          required
          defaultValue={content.type}
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-sm"
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="edit-title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id="edit-title"
          name="title"
          type="text"
          required
          defaultValue={content.title}
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="edit-body" className="block text-sm font-medium mb-1">
          Body / description
        </label>
        <textarea
          id="edit-body"
          name="body"
          rows={6}
          defaultValue={content.body ?? ""}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
        />
      </div>

      <div className="space-y-3">
        <div>
          <span className="block text-sm font-medium mb-2">Images &amp; videos</span>
          <MediaUploadField channelId={channelId} mediaUrls={mediaUrls} onMediaChange={setMediaUrls} />
        </div>

        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 space-y-3">
          <div className="flex justify-between items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Or paste URLs</label>
            <button
              type="button"
              onClick={addMedia}
              className="text-sm font-medium text-primary hover:underline"
            >
              + Add URL
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Optional. Use any public HTTPS link, or upload files above when R2 is configured.
          </p>
          {mediaUrls.map((m, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={m.url}
                onChange={(e) => updateMedia(i, "url", e.target.value)}
                className="flex-1 min-w-0 min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-sm"
              />
              <select
                value={m.type}
                onChange={(e) => updateMedia(i, "type", e.target.value)}
                className="min-h-11 rounded-xl border border-input bg-background px-3 py-3 text-sm shrink-0"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium mb-2">Topics</span>
        <TopicTagPicker allTags={allTags} value={tagIds} onChange={setTagIds} max={3} />
      </div>

      <div className="rounded-xl border border-border/70 bg-muted/15 p-4">
        <label className="flex items-start gap-3 text-sm font-medium text-foreground cursor-pointer">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={content.is_featured ?? false}
            className="mt-0.5 size-4 rounded border-input"
          />
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-muted-foreground" aria-hidden />
            Feature on homepage
          </span>
        </label>
        <p className="mt-1.5 pl-7 text-xs text-muted-foreground">
          Featured posts appear in the highlighted strip on the homepage.
        </p>
      </div>

      {hasAlreadyAcceptedDisclaimer ? (
        <ContentSubmissionDisclaimerAccepted />
      ) : (
        <ContentSubmissionDisclaimer
          id="edit-content-disclaimer"
          checked={acceptedDisclaimer}
          onCheckedChange={setAcceptedDisclaimer}
        />
      )}

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!effectiveAccepted} className="min-h-11 touch-manipulation">
          Save changes
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/channel/${channelSlug}/content/${content.id}`)}
          className="min-h-11 touch-manipulation"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
