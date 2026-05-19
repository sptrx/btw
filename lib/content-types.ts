export type ContentType = "video" | "podcast" | "article" | "discussion";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  video: "Video",
  podcast: "Podcast",
  article: "Article",
  discussion: "Discussion",
};

export function contentTypeLabel(type: string): string {
  return CONTENT_TYPE_LABELS[type as ContentType] ?? type.charAt(0).toUpperCase() + type.slice(1);
}
