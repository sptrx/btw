export type ShortStatus =
  | "uploading"
  | "processing"
  | "pending_review"
  | "approved"
  | "rejected"
  | "failed";

export type ShortItem = {
  id: string;
  caption: string;
  streamUid: string | null;
  status: ShortStatus;
  durationSeconds: number | null;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorUsername: string | null;
  rejectionReason?: string | null;
  reviewedAt: string | null;
  reviewerName: string | null;
  /** Built on the server from the runtime customer code; null when not configured. */
  playerUrl: string | null;
  posterUrl: string | null;
};

export const SHORT_STATUS_LABEL: Record<ShortStatus, string> = {
  uploading: "Uploading",
  processing: "Processing",
  pending_review: "Waiting for review",
  approved: "Live",
  rejected: "Not approved",
  failed: "Upload failed",
};

/**
 * Which home-feed tabs mix shorts in. "for_you" and "all" draw from the whole
 * pool; a category chip like "testimonies" is about written posts, so it doesn't.
 */
export function shortsInFeedFilter(filter: string): boolean {
  return filter === "all" || filter === "for_you" || filter === "following" || filter === "videos" || filter === "shorts";
}
