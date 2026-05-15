"use client";

import { useActionState, useState } from "react";
import { createChannel } from "@/actions/channels";
import { TopicTagPicker } from "@/components/tags/topic-tag-picker";

type Tag = { id: string; slug: string; label: string };

type Props = {
  allTags: Tag[];
};

export default function CreateChannelForm({ allTags }: Props) {
  const [tagIds, setTagIds] = useState<string[]>([]);

  const [state, formAction] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createChannel(formData);
      return result && "error" in result ? { error: result.error } : null;
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-foreground">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Bible Study Basics"
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-foreground">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="What this channel is about..."
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
        />
      </div>

      <div>
        <span className="block text-sm font-medium mb-2">Topics</span>
        <TopicTagPicker
          allTags={allTags}
          value={tagIds}
          onChange={setTagIds}
          max={3}
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <button
        type="submit"
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 touch-manipulation"
      >
        Create channel
      </button>
    </form>
  );
}
