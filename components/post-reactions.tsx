"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Popover } from "radix-ui";
import { clearPostReaction, setPostReaction } from "@/actions/reactions";
import {
  POST_REACTION_META,
  POST_REACTION_TYPES,
  reactionTypesWithCounts,
  totalReactions,
  type FeedPostKind,
  type PostReactionType,
  type ReactionCounts,
} from "@/lib/post-reactions";
import { cn } from "@/lib/utils";

type Props = {
  postId: string;
  postKind: FeedPostKind;
  initialCounts: ReactionCounts;
  initialUserReaction: PostReactionType | null;
  isAuthenticated: boolean;
  loginNext?: string;
  compact?: boolean;
  className?: string;
};

export function PostReactions({
  postId,
  postKind,
  initialCounts,
  initialUserReaction,
  isAuthenticated,
  loginNext,
  compact = false,
  className,
}: Props) {
  const router = useRouter();
  const [counts, setCounts] = useState(initialCounts);
  const [userReaction, setUserReaction] = useState(initialUserReaction);
  const [open, setOpen] = useState(false);
  const [pulseType, setPulseType] = useState<PostReactionType | null>(null);
  const [pending, startTransition] = useTransition();

  const loginHref = `/auth/login?next=${encodeURIComponent(loginNext ?? "/feed")}`;

  const triggerPulse = useCallback((type: PostReactionType) => {
    setPulseType(null);
    requestAnimationFrame(() => {
      setPulseType(type);
      window.setTimeout(() => setPulseType((cur) => (cur === type ? null : cur)), 280);
    });
  }, []);

  const applyOptimistic = (prev: PostReactionType | null, next: PostReactionType | null) => {
    setCounts((c) => {
      const nextCounts = { ...c };
      if (prev) nextCounts[prev] = Math.max(0, nextCounts[prev] - 1);
      if (next) nextCounts[next] += 1;
      return nextCounts;
    });
    setUserReaction(next);
  };

  const handlePick = (type: PostReactionType) => {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }

    const prev = userReaction;
    const next = prev === type ? null : type;
    applyOptimistic(prev, next);
    if (next) triggerPulse(next);
    setOpen(false);

    startTransition(async () => {
      const res =
        next === null
          ? await clearPostReaction(postId, postKind)
          : await setPostReaction(postId, postKind, next);
      if (res?.error) {
        applyOptimistic(next, prev);
        setUserReaction(prev);
      } else {
        router.refresh();
      }
    });
  };

  const activeTypes = reactionTypesWithCounts(counts);
  const total = totalReactions(counts);
  const pickerLabel = userReaction
    ? POST_REACTION_META[userReaction].label
    : "Respond in faith";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              disabled={pending}
              aria-label={pickerLabel}
              aria-haspopup="dialog"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150",
                "border-border/80 bg-background/80 text-foreground hover:bg-muted/60 active:scale-[0.98]",
                userReaction && "border-primary/40 bg-primary/5 text-foreground",
                compact && "px-2.5 py-1 text-xs"
              )}
            >
              <span aria-hidden className="text-base leading-none">
                {userReaction ? POST_REACTION_META[userReaction].emoji : "✨"}
              </span>
              <span>{userReaction ? POST_REACTION_META[userReaction].shortLabel : "Respond"}</span>
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="top"
              align="start"
              sideOffset={8}
              className="z-50 rounded-xl border border-border/80 bg-popover p-2 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            >
              <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Faith reactions
              </p>
              <div className="flex flex-wrap gap-1 max-w-[min(100vw-2rem,20rem)]">
                {POST_REACTION_TYPES.map((type) => {
                  const meta = POST_REACTION_META[type];
                  const selected = userReaction === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      title={meta.label}
                      onClick={() => handlePick(type)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-2 text-xs transition-all duration-150 hover:bg-muted",
                        selected && "bg-primary/10 ring-1 ring-primary/30",
                        pulseType === type && "scale-110"
                      )}
                    >
                      <span className="text-lg leading-none" aria-hidden>
                        {meta.emoji}
                      </span>
                      <span className="max-w-[4.5rem] text-center leading-tight text-muted-foreground">
                        {meta.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Popover.Arrow className="fill-border" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {total > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {total} {total === 1 ? "response" : "responses"}
          </span>
        ) : null}
      </div>

      {activeTypes.length > 0 ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {activeTypes.map((type) => (
            <span
              key={type}
              className={cn(
                "inline-flex items-center gap-1 tabular-nums transition-transform duration-200",
                pulseType === type && "scale-110 text-foreground"
              )}
            >
              <span aria-hidden>{POST_REACTION_META[type].emoji}</span>
              <span>{counts[type]}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
