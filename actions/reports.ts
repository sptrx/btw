"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { ReportReason } from "@/lib/report-reasons";

export async function reportContent(
  contentId: string,
  channelSlug: string,
  reason: ReportReason,
  details?: string | null
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to report content." };

  const trimmedDetails = details?.trim().slice(0, 2000) || null;

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    topic_content_id: contentId,
    comment_id: null,
    reason,
    details: trimmedDetails,
  });

  if (error) {
    console.error("[reportContent]", error.message);
    return { error: "Could not submit report. Please try again." };
  }

  revalidatePath(`/channel/${channelSlug}/content/${contentId}`);
  return { success: true };
}

export async function reportComment(
  contentId: string,
  commentId: string,
  channelSlug: string,
  reason: ReportReason,
  details?: string | null
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to report comments." };

  const trimmedDetails = details?.trim().slice(0, 2000) || null;

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    topic_content_id: contentId,
    comment_id: commentId,
    reason,
    details: trimmedDetails,
  });

  if (error) {
    console.error("[reportComment]", error.message);
    return { error: "Could not submit report. Please try again." };
  }

  revalidatePath(`/channel/${channelSlug}/content/${contentId}`);
  return { success: true };
}
