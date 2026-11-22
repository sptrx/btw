"use client";

import { Lightbulb } from "lucide-react";
import { POST_PROMPTS, type PostPrompt } from "@/lib/post-prompts";
import type { SharingType } from "@/lib/sharing-types";

type Props = {
  sharingType: SharingType;
  /** Only offer prompts while the form is still empty, so nothing is overwritten. */
  visible: boolean;
  onPick: (prompt: PostPrompt) => void;
};

export function PostPromptPicker({ sharingType, visible, onPick }: Props) {
  const prompts = POST_PROMPTS[sharingType];
  if (!visible || !prompts || prompts.length === 0) return null;

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/15 p-4">
      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Lightbulb className="size-4 text-muted-foreground" aria-hidden />
        Not sure where to start?
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Pick a prompt. A few honest sentences are enough.
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Writing prompts">
        {prompts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            className="min-h-9 rounded-full border border-border bg-background px-3.5 py-1.5 text-left text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
          >
            {p.title}
          </button>
        ))}
      </div>
    </div>
  );
}
