"use server";

import { createClient } from "@/utils/supabase/server";

export type NotificationPrefs = {
  prayerUpdates: boolean;
  comments: boolean;
  follows: boolean;
  reactions: boolean;
  wordOfGodReminder: boolean;
  channelUpdates: boolean;
};

const DEFAULTS: NotificationPrefs = {
  prayerUpdates: true,
  comments: true,
  follows: true,
  reactions: true,
  wordOfGodReminder: true,
  channelUpdates: true,
};

function mapRow(row: {
  prayer_updates: boolean;
  comments: boolean;
  follows: boolean;
  reactions: boolean;
  word_of_god_reminder: boolean;
  channel_updates: boolean;
}): NotificationPrefs {
  return {
    prayerUpdates: row.prayer_updates,
    comments: row.comments,
    follows: row.follows,
    reactions: row.reactions,
    wordOfGodReminder: row.word_of_god_reminder,
    channelUpdates: row.channel_updates,
  };
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULTS;

  const { data, error } = await supabase
    .from("notification_preference")
    .select(
      "prayer_updates, comments, follows, reactions, word_of_god_reminder, channel_updates"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return DEFAULTS;
  return mapRow(data);
}

export async function updateNotificationPrefs(
  prefs: Partial<NotificationPrefs>
): Promise<{ success: true; prefs: NotificationPrefs } | { error: string; needsAuth?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save alert choices.", needsAuth: true };

  const current = await getNotificationPrefs();
  const next: NotificationPrefs = { ...current, ...prefs };

  const { data, error } = await supabase
    .from("notification_preference")
    .upsert(
      {
        user_id: user.id,
        prayer_updates: next.prayerUpdates,
        comments: next.comments,
        follows: next.follows,
        reactions: next.reactions,
        word_of_god_reminder: next.wordOfGodReminder,
        channel_updates: next.channelUpdates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select(
      "prayer_updates, comments, follows, reactions, word_of_god_reminder, channel_updates"
    )
    .single();

  if (error || !data) return { error: error?.message ?? "Could not save preferences." };
  return { success: true, prefs: mapRow(data) };
}
