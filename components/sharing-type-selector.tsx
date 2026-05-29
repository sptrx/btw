"use client";

import {
  SHARING_TYPE_CONFIG,
  SHARING_TYPES,
  type SharingType,
} from "@/lib/sharing-types";
import { cn } from "@/lib/utils";

type Props = {
  value: SharingType;
  onChange: (value: SharingType) => void;
  className?: string;
};

export function SharingTypeSelector({ value, onChange, className }: Props) {
  return (
    <div className={className}>
      <span className="block text-sm font-medium mb-2">What are you sharing?</span>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
        role="radiogroup"
        aria-label="What are you sharing?"
      >
        {SHARING_TYPES.map((type) => {
          const config = SHARING_TYPE_CONFIG[type];
          const Icon = config.icon;
          const selected = value === type;
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(type)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors touch-manipulation",
                selected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border/80 bg-background hover:bg-muted/40"
              )}
            >
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                {config.label}
              </span>
              <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                {config.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
