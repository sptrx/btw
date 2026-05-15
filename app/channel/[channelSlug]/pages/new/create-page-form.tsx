"use client";

import { useActionState } from "react";
import { createChannelPage } from "@/actions/channels";

type Props = { channelId: string; channelSlug: string };

export default function CreatePageForm({ channelId }: Props) {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createChannelPage(channelId, formData);
      return result && "error" in result ? { error: result.error } : null;
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-foreground">Page title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Videos, Podcasts, Studies"
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <button
        type="submit"
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 touch-manipulation"
      >
        Create page
      </button>
    </form>
  );
}
