"use client";

import { useFormState } from "react-dom";
import { createChannelPage } from "@/actions/channels";

type Props = { channelId: string; channelSlug: string };

export default function CreatePageForm({ channelId }: Props) {
  const [state, formAction] = useFormState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createChannelPage(channelId, formData);
      return result && "error" in result ? { error: result.error } : null;
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">Page title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Videos, Podcasts, Studies"
          className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Create page
      </button>
    </form>
  );
}
