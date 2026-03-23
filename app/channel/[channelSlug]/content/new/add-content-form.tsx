"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createContent } from "@/actions/channels";
import { Button } from "@/components/ui/button";
import { MediaUploadField, type MediaItem } from "@/components/media-upload-field";

const CONTENT_TYPES = [
  { value: "video", label: "Video" },
  { value: "podcast", label: "Podcast" },
  { value: "article", label: "Article" },
  { value: "discussion", label: "Discussion" },
] as const;

type Page = { id: string; slug: string; title: string };

type Props = {
  channelId: string;
  channelSlug: string;
  pages: Page[];
  defaultPageId: string | null;
};

export default function AddContentForm({ channelId, channelSlug, pages, defaultPageId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pageId, setPageId] = useState(defaultPageId ?? pages[0]?.id ?? "");
  const [mediaUrls, setMediaUrls] = useState<MediaItem[]>([]);
  const router = useRouter();

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
        const targetPage = pageId || pages[0]?.id;
        if (!targetPage) {
          setError("Select a page first.");
          return;
        }
        formData.set("media_urls", JSON.stringify(mediaUrls.filter((m) => m.url)));
        const res = await createContent(channelId, targetPage, formData);
        if (res?.error) setError(res.error);
        else router.push(`/channel/${channelSlug}`);
      }}
      className="max-w-xl space-y-6"
    >
      <div>
        <label htmlFor="content-page" className="block text-sm font-medium mb-1">
          Page
        </label>
        <select
          id="content-page"
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
        <label htmlFor="content-type" className="block text-sm font-medium mb-1">
          Content type
        </label>
        <select
          id="content-type"
          name="type"
          required
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
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-1">
          Body / description
        </label>
        <textarea
          id="body"
          name="body"
          rows={6}
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

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="min-h-11 touch-manipulation">
          Publish
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/channel/${channelSlug}`)}
          className="min-h-11 touch-manipulation"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
