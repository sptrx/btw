/** Display order follows the response row on Instagram and X: heart first, repost last. */
export const POST_REACTION_TYPES = [
  "blessed",
  "amen",
  "spirit_filled",
  "praise_god",
  "sharing",
] as const;

export type PostReactionType = (typeof POST_REACTION_TYPES)[number];

export type FeedPostKind = "topic_content" | "prayer_request" | "praise_report" | "short";

/**
 * Glyphs people already know from Instagram, X, and Reddit.
 * Heart is the like on Instagram and X, fire and raised hands are Instagram quick reactions,
 * and the repost arrows are how X marks a share. Labels stay the faith words.
 */
export const POST_REACTION_META: Record<
  PostReactionType,
  { emoji: string; label: string; shortLabel: string }
> = {
  amen: { emoji: "🙏", label: "Amen", shortLabel: "Amen" },
  blessed: { emoji: "❤️", label: "This blessed me", shortLabel: "Blessed me" },
  spirit_filled: { emoji: "🔥", label: "Spirit-filled", shortLabel: "Spirit-filled" },
  sharing: { emoji: "🔁", label: "Sharing this", shortLabel: "Sharing" },
  praise_god: { emoji: "🙌", label: "Praise God", shortLabel: "Praise God" },
};

export type ReactionCounts = Record<PostReactionType, number>;

export function emptyReactionCounts(): ReactionCounts {
  return {
    amen: 0,
    blessed: 0,
    spirit_filled: 0,
    sharing: 0,
    praise_god: 0,
  };
}

export function totalReactions(counts: ReactionCounts): number {
  return POST_REACTION_TYPES.reduce((sum, t) => sum + counts[t], 0);
}

export function reactionTypesWithCounts(counts: ReactionCounts): PostReactionType[] {
  return POST_REACTION_TYPES.filter((t) => counts[t] > 0);
}
