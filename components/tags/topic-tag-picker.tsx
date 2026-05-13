"use client";

import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

type Tag = { id: string; slug: string; label: string };

type Props = {
  allTags: Tag[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  /** Optional override for the helper text shown beneath the pill row. */
  helperText?: string;
};

/**
 * Toggleable pill row used by the channel + post create/edit forms. Caps
 * selection at `max` (default 3). Once at the cap, unselected pills become
 * `aria-disabled` so screen readers/keyboard users know they're inert.
 */
export function TopicTagPicker({
  allTags,
  value,
  onChange,
  max = 3,
  helperText,
}: Props) {
  const selected = useMemo(() => new Set(value), [value]);
  const atCap = selected.size >= max;

  const toggle = useCallback(
    (id: string) => {
      if (selected.has(id)) {
        onChange(value.filter((v) => v !== id));
        return;
      }
      if (selected.size >= max) return;
      onChange([...value, id]);
    },
    [selected, value, onChange, max]
  );

  if (allTags.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No topics available yet. Run the topic-tags migration to add them.
      </p>
    );
  }

  const helper =
    helperText ?? `Pick up to ${max} ${max === 1 ? "topic" : "topics"} to help readers find this.`;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const isSelected = selected.has(tag.id);
          const isDisabled = !isSelected && atCap;
          return (
            <button
              key={tag.id}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-disabled={isDisabled || undefined}
              onClick={() => {
                if (isDisabled) return;
                toggle(tag.id);
              }}
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border bg-muted/60 text-muted-foreground hover:bg-muted",
                isDisabled && "opacity-50 cursor-not-allowed hover:bg-muted/60"
              )}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {helper}
        {selected.size > 0 ? (
          <>
            {" "}
            <span className="text-foreground/70">
              ({selected.size}/{max} selected)
            </span>
          </>
        ) : null}
      </p>

      {/* Hidden inputs so this picker works inside a plain `<form action={server action}>`.
          The server action reads `tag_ids` (multi-valued) and `tags_present` (marker
          to distinguish "no picker" from "user cleared every tag"). */}
      <input type="hidden" name="tags_present" value="1" />
      {value.map((id) => (
        <input key={id} type="hidden" name="tag_ids" value={id} />
      ))}
    </div>
  );
}
