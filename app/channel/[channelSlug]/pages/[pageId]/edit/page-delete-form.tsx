"use client";

import { useActionState, useState } from "react";
import { deleteChannelPage } from "@/actions/channels";
import { Button } from "@/components/ui/button";

type Props = {
  channelId: string;
  pageId: string;
  pageTitle: string;
};

export function PageDeleteForm({ channelId, pageId, pageTitle }: Props) {
  const [confirmText, setConfirmText] = useState("");
  const mustMatch = `delete ${pageTitle}`;
  const canDelete = confirmText.trim().toLowerCase() === mustMatch.toLowerCase();

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await deleteChannelPage(formData);
      return result && "error" in result ? { error: result.error } : null;
    },
    null as { error?: string } | null
  );

  return (
    <div className="border border-destructive/30 rounded-2xl p-6 bg-destructive/5 space-y-4 max-w-lg">
      <h2 className="text-lg font-semibold text-destructive">Delete this page</h2>
      <p className="text-sm text-muted-foreground">
        Posts on this page will be moved to the channel home. This can&apos;t be undone.
      </p>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="channel_id" value={channelId} />
        <input type="hidden" name="page_id" value={pageId} />
        <div className="space-y-2">
          <label htmlFor="page-delete-confirm" className="text-sm font-medium text-foreground">
            Type <span className="font-mono text-destructive">{mustMatch}</span> to confirm
          </label>
          <input
            id="page-delete-confirm"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-sm"
            autoComplete="off"
            aria-invalid={confirmText.length > 0 && !canDelete}
          />
        </div>
        {state?.error && (
          <p className="text-destructive text-sm" role="alert">
            {state.error}
          </p>
        )}
        <Button
          type="submit"
          variant="destructive"
          disabled={pending || !canDelete}
          className="min-h-11 w-full touch-manipulation sm:w-auto"
        >
          {pending ? "Deleting…" : "Delete page permanently"}
        </Button>
      </form>
    </div>
  );
}
