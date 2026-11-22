"use server";

import { getProfile } from "@/actions";
import { getPrayerWallFeed, type PrayerRequestListItem } from "@/actions/prayer";
import { todaysVerse, type DailyVerse } from "@/lib/daily-verse";
import { countryName, normalizeCountryCode } from "@/lib/geo";
import { createClient } from "@/utils/supabase/server";

export type FollowedChannelCard = {
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
};

export type PersonalizedHomeData = {
  displayName: string;
  countryCode: string | null;
  placeLabel: string | null;
  verse: DailyVerse;
  channels: FollowedChannelCard[];
  prayers: PrayerRequestListItem[];
  prayersAreNearby: boolean;
};

type TopicEmbed = {
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  archived_at: string | null;
};

export async function getPersonalizedHome(userId: string): Promise<PersonalizedHomeData> {
  const supabase = await createClient();
  const profile = await getProfile(userId);
  const countryCode = normalizeCountryCode(profile?.country_code);
  const city = profile?.city?.trim() || null;
  const placeLabel = city || (countryCode ? countryName(countryCode) : null);
  const displayName =
    profile?.display_name?.trim() || profile?.username?.trim() || "friend";

  const membership = await supabase
    .from("topic_members")
    .select("topics:topic_id ( slug, title, description, cover_image_url, archived_at )")
    .eq("user_id", userId)
    .eq("status", "approved")
    .limit(12);

  const channels: FollowedChannelCard[] = [];
  if (!membership.error) {
    for (const row of membership.data ?? []) {
      const topic = row.topics as TopicEmbed | TopicEmbed[] | null;
      const channel = Array.isArray(topic) ? topic[0] : topic;
      if (!channel || channel.archived_at) continue;
      channels.push({
        slug: channel.slug,
        title: channel.title,
        description: channel.description?.trim() || null,
        coverUrl: channel.cover_image_url?.trim() || null,
      });
    }
  } else {
    console.warn("[home] followed channels:", membership.error.message);
  }

  let prayers: PrayerRequestListItem[] = [];
  let prayersAreNearby = false;
  if (countryCode) {
    prayers = await getPrayerWallFeed("unanswered", 3, { countryCode });
    prayersAreNearby = prayers.length > 0;
  }
  if (prayers.length === 0) {
    prayers = await getPrayerWallFeed("unanswered", 3);
  }

  return {
    displayName,
    countryCode,
    placeLabel,
    verse: todaysVerse(),
    channels,
    prayers,
    prayersAreNearby,
  };
}
