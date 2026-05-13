"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { updateChannel } from "@/actions/channels";
import { authInputClass, authPrimaryButtonClass } from "@/lib/auth-form-styles";
import { TopicTagPicker } from "@/components/tags/topic-tag-picker";

type Tag = { id: string; slug: string; label: string };

type Props = {
  channelId: string;
  initialTitle: string;
  initialDescription: string;
  initialSlug: string;
  allTags: Tag[];
  initialTagIds: string[];
};

export function ChannelSettingsForm({
  channelId,
  initialTitle,
  initialDescription,
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

      <div className="space-y-2">
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
