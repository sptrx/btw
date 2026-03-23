"use client";

import { useActionState, useState } from "react";
import { deleteChannel } from "@/actions/channels";
import { Button } from "@/components/ui/button";

type Props = { channelId: string; channelTitle: string };

export function ChannelDeleteForm({ channelId, channelTitle }: Props) {
  const [confirmText, setConfirmText] = useState("");
  const mustMatch = `delete ${channelTitle}`;
  const canDelete = confirmText.trim().toLowerCase() === mustMatch.toLowerCase();

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await deleteChannel(formData);
      return result && "error" in result ? { error: result.error } : null;
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <input type="hidden" name="channel_id" value={channelId} />
      <div className="space-y-2">
        <label htmlFor="delete-confirm" className="text-sm font-medium text-foreground">
          Type <span className="font-mono text-destructive">{mustMatch}</span> to confirm
        </label>
        <input
          id="delete-confirm"
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
        {pending ? "Deleting…" : "Delete channel permanently"}
      </Button>
    </form>
  );
}
