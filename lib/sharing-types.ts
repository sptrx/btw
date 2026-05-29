import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  HandHeart,
  Lightbulb,
  MessageCircleQuestion,
  MessagesSquare,
  Sparkles,
  Sun,
} from "lucide-react";

/** Semantic "what are you sharing?" — separate from media format (`ContentType`). */
export type SharingType =
  | "testimony"
  | "revelation"
  | "prayer_request"
  | "praise_report"
  | "question"
  | "discussion"
  | "devotional";

export const SHARING_TYPES: SharingType[] = [
  "testimony",
  "revelation",
  "prayer_request",
  "praise_report",
  "question",
  "discussion",
  "devotional",
];

export type SharingTypeConfig = {
  value: SharingType;
  label: string;
  shortLabel: string;
  description: string;
  placeholder: string;
  icon: LucideIcon;
  /** Tailwind classes for badge pill (light + dark) */
  badgeClass: string;
  /** Routes prayer/praise to dedicated flows when true */
  externalFlow?: "prayer" | "praise";
};

export const SHARING_TYPE_CONFIG: Record<SharingType, SharingTypeConfig> = {
  testimony: {
    value: "testimony",
    label: "Testimony",
    shortLabel: "Testimony",
    description: "Here's what God did in my life",
    placeholder: "Share what God has done in your life…",
    icon: Sparkles,
    badgeClass:
      "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-100",
  },
  revelation: {
    value: "revelation",
    label: "Revelation",
    shortLabel: "Revelation",
    description: "What God showed you in Scripture or prayer",
    placeholder: "What did God reveal to you in Scripture or prayer?",
    icon: Lightbulb,
    badgeClass:
      "border-violet-500/40 bg-violet-500/15 text-violet-900 dark:text-violet-100",
  },
  prayer_request: {
    value: "prayer_request",
    label: "Prayer request",
    shortLabel: "Prayer",
    description: "Ask the community to pray (Prayer Wall)",
    placeholder: "",
    icon: HandHeart,
    badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-900 dark:text-sky-100",
    externalFlow: "prayer",
  },
  praise_report: {
    value: "praise_report",
    label: "Praise report",
    shortLabel: "Praise",
    description: "Celebrate answered prayer or God's goodness",
    placeholder: "Share how God answered or showed up…",
    icon: Sun,
    badgeClass:
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100",
  },
  question: {
    value: "question",
    label: "Question / seeking",
    shortLabel: "Question",
    description: "Wrestle openly — welcome responses from the community",
    placeholder: "What are you seeking understanding about?",
    icon: MessageCircleQuestion,
    badgeClass: "border-teal-500/40 bg-teal-500/15 text-teal-900 dark:text-teal-100",
  },
  discussion: {
    value: "discussion",
    label: "Discussion",
    shortLabel: "Discussion",
    description: "Open-ended topic or conversation",
    placeholder: "Start the conversation — what's on your heart?",
    icon: MessagesSquare,
    badgeClass:
      "border-border/80 bg-muted/60 text-foreground/90",
  },
  devotional: {
    value: "devotional",
    label: "Devotional",
    shortLabel: "Devotional",
    description: "Scripture, reflection, and application",
    placeholder: "Reflection and application for today…",
    icon: BookOpen,
    badgeClass: "border-rose-500/40 bg-rose-500/15 text-rose-900 dark:text-rose-100",
  },
};

export function isSharingType(value: string): value is SharingType {
  return SHARING_TYPES.includes(value as SharingType);
}

export function sharingTypeLabel(type: string): string {
  if (isSharingType(type)) return SHARING_TYPE_CONFIG[type].label;
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
}

export function sharingTypeBadgeClass(type: string): string {
  if (isSharingType(type)) return SHARING_TYPE_CONFIG[type].badgeClass;
  return "border-border/80 bg-muted/50 text-foreground/80";
}

/** Feed filter ids aligned with sharing types (+ legacy aggregates). */
export type SharingFeedFilter =
  | "all"
  | "following"
  | "testimonies"
  | "revelations"
  | "discussions"
  | "questions"
  | "devotionals"
  | "praise"
  | "prayer"
  | "videos";

export const SHARING_FEED_FILTERS: { id: SharingFeedFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "following", label: "Following" },
  { id: "testimonies", label: "Testimonies" },
  { id: "revelations", label: "Revelations" },
  { id: "questions", label: "Questions" },
  { id: "devotionals", label: "Devotionals" },
  { id: "discussions", label: "Discussions" },
  { id: "praise", label: "Praise" },
  { id: "prayer", label: "Prayer" },
  { id: "videos", label: "Videos" },
];

export function browseTypeHref(type: SharingType): string {
  return `/feed?filter=${type === "testimony" ? "testimonies" : type === "revelation" ? "revelations" : type === "question" ? "questions" : type === "devotional" ? "devotionals" : type === "praise_report" ? "praise" : type === "prayer_request" ? "prayer" : type === "discussion" ? "discussions" : "all"}`;
}

/** Map sharing type to default media `type` on insert. */
export function defaultMediaTypeForSharing(sharingType: SharingType): "article" | "discussion" {
  return sharingType === "discussion" ? "discussion" : "article";
}
