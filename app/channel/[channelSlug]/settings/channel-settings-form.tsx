"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { updateChannel } from "@/actions/channels";
import { authInputClass, authPrimaryButtonClass } from "@/lib/auth-form-styles";
import { TopicTagPicker } from "@/components/tags/topic-tag-picker";

function BannerField({ channelId, initialUrl }: { channelId: string; initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.set("channelId", channelId);
      body.set("file", file, file.name);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string; publicUrl?: string };
      if (!res.ok || !data.publicUrl) {
        throw new Error(data.error || "Upload failed. Paste an https image link instead.");
      }
      setUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div id="banner" className="space-y-2 scroll-mt-28">
      <label htmlFor="ch-banner" className="text-sm font-medium text-foreground">
        Banner
      </label>
      <p className="text-xs text-muted-foreground">
        A wide image at the top of your channel. Upload one, or paste an https link.
      </p>
      <input type="hidden" name="banner_image_url" value={url} />
      <input
        id="ch-banner"
        type="url"
        inputMode="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://"
        className={authInputClass}
      />
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }}
        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
      />
      {uploading ? <p className="text-sm text-muted-foreground">Uploading…</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="aspect-[3/1] w-full rounded-xl object-cover" />
      ) : null}
    </div>
  );
}

type Tag = { id: string; slug: string; label: string };

type Props = {
  channelId: string;
  initialTitle: string;
  initialDescription: string;
  initialBanner: string;
  initialSlug: string;
  allTags: Tag[];
  initialTagIds: string[];
};

export function ChannelSettingsForm({
  channelId,
  initialTitle,
  initialDescription,
  initialBanner,
  initialSlug,
  allTags,
  initialTagIds,
}: Props) {
  const searchParams = useSearchParams();
  const updated = searchParams.get("updated") === "1";
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await updateChannel(formData);
      return result && "error" in result ? { error: result.error } : null;
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <input type="hidden" name="channel_id" value={channelId} />

      {updated && (
        <p className="text-sm text-primary" role="status">
          Channel saved.
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="ch-title" className="text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="ch-title"
          name="title"
          type="text"
          required
          defaultValue={initialTitle}
          className={authInputClass}
          autoComplete="off"
        />
      </div>

      <BannerField channelId={channelId} initialUrl={initialBanner} />

      <div id="description" className="space-y-2 scroll-mt-28">
        <label htmlFor="ch-desc" className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="ch-desc"
          name="description"
          rows={4}
          defaultValue={initialDescription}
          className={`${authInputClass} min-h-[6rem] resize-y`}
          placeholder="What this channel is about…"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Topics</label>
        <TopicTagPicker
          allTags={allTags}
          value={tagIds}
          onChange={setTagIds}
          max={3}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="ch-slug" className="text-sm font-medium text-foreground">
          URL slug
        </label>
        <p className="text-xs text-muted-foreground">
          Appears as <span className="font-mono text-foreground">/channel/{initialSlug}</span>. Changing it will break old links.
        </p>
        <input
          id="ch-slug"
          name="slug"
          type="text"
          defaultValue={initialSlug}
          className={`${authInputClass} font-mono text-sm`}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {state?.error && (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={authPrimaryButtonClass}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
