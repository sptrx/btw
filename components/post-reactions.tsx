"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  /** Site-relative path used when tapping Sharing (e.g. `/channel/foo/content/123`). */
  sharePath?: string;
  shareTitle?: string;
  shareText?: string;
  className?: string;
};

function buildShareUrl(path: string): string {
  if (typeof window === "undefined") return path;
  try {
    const u = new URL(path, window.location.origin);
    return `${u.origin}${u.pathname}`;
  } catch {
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  }
}

async function shareLink(path: string, title?: string, text?: string) {
  const url = buildShareUrl(path);
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    const payload = { title, text: text ?? title, url };
    try {
      if (!navigator.canShare || navigator.canShare(payload)) {
        await navigator.share(payload);
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return;
    }
  } catch {
    /* fall through */
  }
  window.prompt("Copy this link to share:", url);
}

export function PostReactions({
  postId,
  postKind,
  initialCounts,
  initialUserReaction,
  isAuthenticated,
  loginNext,
  sharePath,
  shareTitle,
  shareText,
  className,
}: Props) {
  const router = useRouter();
  const [counts, setCounts] = useState(initialCounts);
  const [userReaction, setUserReaction] = useState(initialUserReaction);
  const [pulseType, setPulseType] = useState<PostReactionType | null>(null);
  const [pending, startTransition] = useTransition();
  const [shareHint, setShareHint] = useState<string | null>(null);

  const loginHref = `/auth/login?next=${encodeURIComponent(loginNext ?? "/")}`;

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
    if (type === "sharing" && sharePath) {
      void shareLink(sharePath, shareTitle, shareText).then(() => {
        setShareHint("Ready to share");
        window.setTimeout(() => setShareHint(null), 1600);
      });
    }

    if (!isAuthenticated) {
      // Sharing already opened the sheet; other reactions need sign-in.
      if (type !== "sharing") router.push(loginHref);
      return;
    }

    const prev = userReaction;
    const next = prev === type ? null : type;
    // Tapping Sharing while already selected still shares above, but don't clear the reaction.
    if (type === "sharing" && prev === "sharing") {
      return;
    }

    applyOptimistic(prev, next);
    if (next) triggerPulse(next);

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

  const total = totalReactions(counts);
  const used = reactionTypesWithCounts(counts);
  const selectedTone: Record<PostReactionType, string> = {
    blessed: "border-red-500/45 bg-red-500/10",
    amen: "border-primary/40 bg-primary/5",
    spirit_filled: "border-orange-500/45 bg-orange-500/10",
    praise_god: "border-amber-500/45 bg-amber-500/10",
    sharing: "border-emerald-600/45 bg-emerald-600/10",
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Responses">
        {POST_REACTION_TYPES.map((type) => {
          const meta = POST_REACTION_META[type];
          const selected = userReaction === type;
          const count = counts[type];
          const tip = type === "sharing" ? `${meta.label}. Opens the share sheet.` : meta.label;
          return (
            <button
              key={type}
              type="button"
              disabled={pending && type !== "sharing"}
              aria-label={
                type === "sharing"
                  ? `Share this post${count > 0 ? `, ${count}` : ""}`
                  : `${meta.label}${count > 0 ? `, ${count}` : ""}`
              }
              aria-pressed={selected}
              onClick={() => handlePick(type)}
              className={cn(
                "group/reaction relative inline-flex min-h-9 min-w-9 items-center justify-center gap-1 rounded-full border px-2 py-1.5 text-sm transition-all duration-150",
                "border-border/80 bg-background/80 hover:bg-muted/60 active:scale-[0.98]",
                selected && selectedTone[type],
                pulseType === type && "scale-110"
              )}
            >
              <span className="text-lg leading-none" aria-hidden>
                {meta.emoji}
              </span>
              {count > 0 ? (
                <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
              ) : null}
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-sm transition-opacity group-hover/reaction:opacity-100 group-focus-visible/reaction:opacity-100"
              >
                {tip}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {total > 0 ? (
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <span aria-hidden className="text-sm leading-none tracking-tight">
              {used.map((type) => POST_REACTION_META[type].emoji).join("")}
            </span>
            {total} {total === 1 ? "response" : "responses"}
          </span>
        ) : null}
        {shareHint ? <span className="text-primary">{shareHint}</span> : null}
      </div>
    </div>
  );
}
