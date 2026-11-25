import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";
import { SHORT_MAX_SECONDS, deleteStreamVideo, getStreamVideo } from "@/lib/stream";
import type { ShortStatus } from "@/lib/shorts-types";

/**
 * Looks at the video on Stream and moves the row forward. Used after the browser
 * finishes uploading and by the webhook. Needs the service-role client.
 */
export async function syncShortFromStream(uid: string): Promise<ShortStatus | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: row } = await admin.from("shorts").select("id, status").eq("stream_uid", uid).maybeSingle();
  if (!row) {
    console.error("[shorts-sync] No short found for Stream video", uid);
    return null;
  }
  if (!["uploading", "processing"].includes(row.status as string)) return row.status as ShortStatus;

  let next: ShortStatus = "processing";
  let duration: number | null = null;
  try {
    const video = await getStreamVideo(uid);
    duration = video.duration > 0 ? video.duration : null;
    if (video.status?.state === "error") next = "failed";
    else if (video.readyToStream) {
      next = duration !== null && duration > SHORT_MAX_SECONDS + 0.5 ? "failed" : "pending_review";
    }
  } catch (e) {
    console.error("[shorts-sync] Stream lookup failed:", uid, e instanceof Error ? e.message : e);
    return row.status as ShortStatus;
  }
  if (next === "failed") await deleteStreamVideo(uid);
  const { error } = await admin
    .from("shorts")
    .update({ status: next, duration_seconds: duration })
    .eq("id", row.id);
  if (error) console.error("[shorts-sync] Could not update short:", row.id, error.message);
  return next;
}
