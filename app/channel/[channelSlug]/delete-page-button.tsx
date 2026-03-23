"use client";

import { useActionState } from "react";
import { deleteChannelPage } from "@/actions/channels";
import { Button } from "@/components/ui/button";

type Props = {
  channelId: string;
  pageId: string;
  pageTitle: string;
};

export function DeletePageButton({ channelId, pageId, pageTitle }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await deleteChannelPage(formData);
      return result && "error" in result ? { error: result.error } : null;
    },
    null as { error?: string } | null
  );

  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete page "${pageTitle}"? All content on this page will be moved to Home. This cannot be undone.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="channel_id" value={channelId} />
      <input type="hidden" name="page_id" value={pageId} />
      {state?.error && (
        <p className="text-destructive text-sm mb-2 max-w-md" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="destructive" size="sm" disabled={pending} className="touch-manipulation">
        {pending ? "Deleting…" : "Delete page"}
      </Button>
    </form>
  );
}
