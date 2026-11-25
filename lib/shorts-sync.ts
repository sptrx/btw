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
  if (!row) return null;
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
  } catch {
    return row.status as ShortStatus;
  }
  if (next === "failed") await deleteStreamVideo(uid);
  await admin.from("shorts").update({ status: next, duration_seconds: duration }).eq("id", row.id);
  return next;
}
