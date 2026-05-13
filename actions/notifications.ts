"use server";

import { createClient } from "@/utils/supabase/server";
import { getProfile } from "@/actions";

/** Maximum rows returned to the bell dropdown — anything older is fetched on demand. */
const NOTIFICATIONS_PAGE_SIZE = 20;

export type NotificationType = "comment" | "like";

/** Hydrated row shape returned to the bell UI. */
export type NotificationItem = {
  id: string;
  type: NotificationType;
  created_at: string;
  read_at: string | null;
  actor: {
    id: string;
    display_name: string | null;
  };
  /** Link target — null when the related content has been deleted. */
  href: string | null;
  /** Title of the content involved (e.g. the post that was liked / commented on). */
  content_title: string | null;
  /** Comment preview, when the notification is a comment. */
  comment_preview: string | null;
};

type RawNotificationRow = {
  id: string;
  type: NotificationType;
  created_at: string;
  read_at: string | null;
  actor_id: string;
  topic_content_id: string | null;
  comment_id: string | null;
};

/** Returned when the migration hasn't been applied yet in this env. */
function isMissingNotificationsRelation(err: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  const code = String(err.code ?? "");
  if (!msg.includes("notifications")) return false;
  if (code === "42P01" || code.startsWith("PGRST")) return true;
  return msg.includes("does not exist") || msg.includes("schema cache");
}

export async function getMyNotifications(): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, created_at, read_at, actor_id, topic_content_id, comment_id")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_PAGE_SIZE);

  if (error) {
    if (isMissingNotificationsRelation(error)) return [];
    console.error("[notifications] list", error);
    return [];
  }

  const rows = (data ?? []) as RawNotificationRow[];
  if (rows.length === 0) return [];

  // Batch-resolve content titles + channel slugs so each notification gets a
  // working href like /channel/<slug>/content/<id>. We also load actor display
  // names from `profiles` for the activity line ("<name> liked your post").
  const contentIds = [
    ...new Set(rows.map((r) => r.topic_content_id).filter((v): v is string => Boolean(v))),
  ];
  const commentIds = [
    ...new Set(rows.map((r) => r.comment_id).filter((v): v is string => Boolean(v))),
  ];
  const actorIds = [...new Set(rows.map((r) => r.actor_id))];

  type ContentRow = {
    id: string;
    title: string;
    topics: { slug: string } | { slug: string }[] | null;
  };
  type CommentRow = { id: string; body: string };

  const [contentRowsRes, commentRowsRes, actorProfiles] = await Promise.all([
    contentIds.length > 0
      ? supabase
          .from("topic_content")
          .select("id, title, topics(slug)")
          .in("id", contentIds)
      : Promise.resolve({ data: [] as ContentRow[], error: null }),
    commentIds.length > 0
      ? supabase
          .from("topic_content_comments")
          .select("id, body")
          .in("id", commentIds)
      : Promise.resolve({ data: [] as CommentRow[], error: null }),
    Promise.all(actorIds.map((id) => getProfile(id).then((p) => [id, p] as const))),
  ]);

  const contentRows = ((contentRowsRes.data ?? []) as ContentRow[]) || [];
  const commentRows = ((commentRowsRes.data ?? []) as CommentRow[]) || [];

  const contentById = new Map<string, { title: string; slug: string | null }>();
  for (const row of contentRows) {
    const topic = Array.isArray(row.topics) ? row.topics[0] : row.topics;
    contentById.set(row.id, {
      title: row.title,
      slug: topic?.slug ?? null,
    });
  }

  const commentById = new Map<string, string>();
  for (const row of commentRows) {
    commentById.set(row.id, row.body);
  }

  const actorById = new Map<string, { display_name: string | null }>();
  for (const [id, profile] of actorProfiles) {
    actorById.set(id, {
      display_name: profile?.display_name ?? null,
    });
  }

  return rows.map((r) => {
    const content = r.topic_content_id ? contentById.get(r.topic_content_id) : null;
    const actor = actorById.get(r.actor_id) ?? { display_name: null };
    const commentBody = r.comment_id ? commentById.get(r.comment_id) ?? null : null;

    let href: string | null = null;
    if (content?.slug && r.topic_content_id) {
      href = `/channel/${content.slug}/content/${r.topic_content_id}`;
    }

    return {
      id: r.id,
      type: r.type,
      created_at: r.created_at,
      read_at: r.read_at,
      actor: { id: r.actor_id, display_name: actor.display_name },
      href,
      content_title: content?.title ?? null,
      comment_preview: commentBody ? truncate(commentBody, 140) : null,
    };
  });
}

function truncate(s: string, max: number): string {
  const cleaned = s.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

export async function getMyUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    if (isMissingNotificationsRelation(error)) return 0;
    console.error("[notifications] unread count", error);
    return 0;
  }
  return count ?? 0;
}

/**
 * Mark every unread notification for the signed-in user as read. Called when
 * the bell dropdown is opened so the badge clears immediately.
 */
export async function markAllNotificationsRead(): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    if (isMissingNotificationsRelation(error)) return { success: true };
    console.error("[notifications] markAllRead", error);
    return { error: error.message };
  }
  return { success: true };
}

/**
 * Insert a notification, skipping when the actor is the recipient (no
 * self-notifications) and when the notifications table isn't there yet. We
 * swallow row-already-exists conflicts (e.g. someone liking a post they
 * already liked after the partial-unique index would have prevented the
 * notification) so the calling action's user-facing flow stays clean.
 */
export async function createNotification(params: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  topicContentId: string;
  commentId?: string | null;
}): Promise<void> {
  if (params.recipientId === params.actorId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    recipient_id: params.recipientId,
    actor_id: params.actorId,
    type: params.type,
    topic_content_id: params.topicContentId,
    comment_id: params.commentId ?? null,
  });

  if (error) {
    if (isMissingNotificationsRelation(error)) return;
    const code = String(error.code ?? "");
    // 23505 = unique_violation (already-notified like). Treat as a no-op.
    if (code === "23505") return;
    console.error("[notifications] create", error);
  }
}
