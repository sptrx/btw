"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getProfile } from "@/actions";
import { contentTypeLabel, type ContentType } from "@/lib/content-types";
import { isSiteModerator } from "@/lib/site-roles";
import type { ReportReason } from "@/lib/report-reasons";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { createModerationRejectedNotification } from "@/actions/notifications";

export type ModerationQueueItem = {
  id: string;
  title: string;
  type: ContentType;
  typeLabel: string;
  bodySnippet: string | null;
  createdAt: string;
  channelSlug: string;
  channelTitle: string;
  href: string;
};

export type ModerationReportItem = {
  id: string;
  reason: ReportReason;
  reasonLabel: string;
  details: string | null;
  createdAt: string;
  contentId: string;
  contentTitle: string;
  channelSlug: string;
  href: string;
  reporterName: string;
};

export type ModerationOverview = {
  pendingCount: number;
  queue: ModerationQueueItem[];
  reports: ModerationReportItem[];
};

async function requireModerator(): Promise<
  { userId: string } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  const profile = await getProfile(user.id);
  if (!isSiteModerator(profile?.role)) {
    return { error: "Moderator access required." };
  }

  return { userId: user.id };
}

function snippet(body: string | null | undefined, max = 200): string | null {
  if (!body?.trim()) return null;
  const t = body.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max).trim()}…`;
}

function reportReasonLabel(reason: string): string {
  return REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason;
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getModerationOverview(): Promise<
  ModerationOverview | { error: string }
> {
  const gate = await requireModerator();
  if ("error" in gate) return gate;

  const supabase = await createClient();

  const { data: pendingRows, error: queueErr } = await supabase
    .from("topic_content")
    .select(
      "id, title, type, body, created_at, topics:topic_id ( title, slug )"
    )
    .eq("moderation_status", "pending_review")
    .order("created_at", { ascending: true })
    .limit(40);

  if (queueErr) {
    console.error("[getModerationOverview] queue", queueErr.message);
    return { error: "Could not load review queue." };
  }

  const queue: ModerationQueueItem[] = [];
  for (const row of pendingRows ?? []) {
    const topic = unwrapRelation(
      row.topics as unknown as
        | { title: string; slug: string }
        | { title: string; slug: string }[]
        | null
    );
    if (!topic) continue;
    const type = (row.type ?? "article") as ContentType;
    queue.push({
      id: row.id,
      title: row.title,
      type,
      typeLabel: contentTypeLabel(type),
      bodySnippet: snippet(row.body),
      createdAt: row.created_at,
      channelSlug: topic.slug,
      channelTitle: topic.title,
      href: `/channel/${topic.slug}/content/${row.id}`,
    });
  }

  const { data: reportRows, error: reportsErr } = await supabase
    .from("content_reports")
    .select(
      `
      id,
      reason,
      details,
      created_at,
      topic_content_id,
      reporter_id,
      topic_content:topic_content_id (
        title,
        topics:topic_id ( slug )
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (reportsErr) {
    console.error("[getModerationOverview] reports", reportsErr.message);
    return { error: "Could not load reports." };
  }

  const reporterIds = [
    ...new Set((reportRows ?? []).map((r) => r.reporter_id).filter(Boolean)),
  ] as string[];
  const reporterNames = new Map<string, string>();
  if (reporterIds.length > 0) {
    const { data: reporterProfiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", reporterIds);
    for (const p of reporterProfiles ?? []) {
      reporterNames.set(p.id, p.display_name?.trim() || "Member");
    }
  }

  const reports: ModerationReportItem[] = [];
  for (const row of reportRows ?? []) {
    const content = unwrapRelation(
      row.topic_content as unknown as
        | {
            title: string;
            topics: { slug: string } | { slug: string }[] | null;
          }
        | null
    );
    const topic = unwrapRelation(content?.topics ?? null);
    if (!content || !topic) continue;
    reports.push({
      id: row.id,
      reason: row.reason as ReportReason,
      reasonLabel: reportReasonLabel(row.reason),
      details: row.details,
      createdAt: row.created_at,
      contentId: row.topic_content_id,
      contentTitle: content.title,
      channelSlug: topic.slug,
      href: `/channel/${topic.slug}/content/${row.topic_content_id}`,
      reporterName: reporterNames.get(row.reporter_id) ?? "Member",
    });
  }

  return {
    pendingCount: queue.length,
    queue,
    reports,
  };
}

export async function approveModeratedContent(
  contentId: string
): Promise<{ success: true } | { error: string }> {
  const gate = await requireModerator();
  if ("error" in gate) return gate;

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("topic_content")
    .select("id, topic_id, topics:topic_id(slug)")
    .eq("id", contentId)
    .maybeSingle();

  if (!row) return { error: "Content not found." };

  const topic = unwrapRelation(
    row.topics as unknown as { slug: string } | { slug: string }[] | null
  );

  const { error } = await supabase
    .from("topic_content")
    .update({ moderation_status: "approved", moderation_note: null })
    .eq("id", contentId);

  if (error) {
    console.error("[approveModeratedContent]", error.message);
    return { error: "Could not approve this post." };
  }

  revalidateModerationPaths(topic?.slug, contentId);
  return { success: true };
}

export async function rejectModeratedContent(
  contentId: string,
  note?: string | null
): Promise<{ success: true } | { error: string }> {
  const gate = await requireModerator();
  if ("error" in gate) return gate;

  const trimmedNote = note?.trim().slice(0, 1000) || null;

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("topic_content")
    .select("id, author_id, topics:topic_id(slug)")
    .eq("id", contentId)
    .maybeSingle();

  if (!row) return { error: "Content not found." };

  const topic = unwrapRelation(
    row.topics as unknown as { slug: string } | { slug: string }[] | null
  );

  const { error } = await supabase
    .from("topic_content")
    .update({
      moderation_status: "rejected",
      moderation_note: trimmedNote,
    })
    .eq("id", contentId);

  if (error) {
    console.error("[rejectModeratedContent]", error.message);
    return { error: "Could not reject this post." };
  }

  if (row.author_id) {
    await createModerationRejectedNotification({
      recipientId: row.author_id,
      actorId: gate.userId,
      topicContentId: contentId,
      detail: trimmedNote,
    });
  }

  revalidateModerationPaths(topic?.slug, contentId);
  return { success: true };
}

function revalidateModerationPaths(channelSlug: string | undefined, contentId: string) {
  revalidatePath("/dashboard/moderation");
  revalidatePath("/");
  if (channelSlug) {
    revalidatePath(`/channel/${channelSlug}`);
    revalidatePath(`/channel/${channelSlug}/content/${contentId}`);
  }
}

export async function checkIsSiteModerator(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  return isSiteModerator(profile?.role);
}
