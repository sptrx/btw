export type ModerationCategory =
  | "ok"
  | "safety"
  | "political"
  | "pure_opinion"
  | "off_topic"
  | "borderline"
  | "spam";

/** Short framing used in forms and the community guide. */
export const MISSION_TAGLINE = "Share what God has done—not what you want the world to do.";

const CATEGORY_MESSAGES: Record<Exclude<ModerationCategory, "ok">, string> = {
  safety:
    "This content includes language or themes that aren't appropriate for our community. Please revise and try again.",
  political:
    "Believe The Works is for testimony and faith experiences, not political campaigns or partisan messaging. Try reframing around what God has done in your life.",
  pure_opinion:
    "This reads like general opinion or commentary rather than testimony or encouragement. Share your faith story, scripture reflection, or how God met you in this season.",
  off_topic:
    "This doesn't seem connected to faith, testimony, or encouragement. BTW is a witness platform—help others by sharing what God has done in your life.",
  borderline:
    "This touches faith but reads thin on personal witness. A moderator will review it before it appears publicly.",
  spam: "This looks like promotional or repetitive content. Please share genuine testimony instead.",
};

export function moderationUserMessage(
  category: ModerationCategory,
  suggestEdit?: string | null
): string {
  if (category === "ok") return "";
  const base = CATEGORY_MESSAGES[category];
  const tip = suggestEdit?.trim();
  if (tip) return `${base} Suggestion: ${tip}`;
  return base;
}

export const PENDING_REVIEW_MESSAGE =
  "Thanks for sharing. Your post is in our review queue and will appear once it aligns with our community purpose.";

export const MODERATION_UNAVAILABLE_MESSAGE =
  "We couldn't verify this content right now. Please try again in a moment.";
