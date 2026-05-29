"use server";

import { createClient } from "@/utils/supabase/server";
import { countryFlagEmoji, countryName } from "@/lib/geo";
import { approvedModerationOrFilter } from "@/lib/moderation";

export type MapSummary = {
  countryCount: number;
  totalPosts: number;
};

export async function getMapSummary(): Promise<MapSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("map_country_aggregates");
  if (error || !data) {
    return { countryCount: 0, totalPosts: 0 };
  }
  const rows = data as { post_count: number }[];
  return {
    countryCount: rows.length,
    totalPosts: rows.reduce((sum, r) => sum + (Number(r.post_count) || 0), 0),
  };
}

export type RecentGeoPost = {
  countryCode: string;
  countryName: string;
  flag: string;
  title: string;
  href: string;
  createdAt: string;
  kind: "content" | "prayer";
};

/** Recent channel posts and public prayer requests with country for homepage ticker. */
export async function getRecentGeoPosts(limit = 8): Promise<RecentGeoPost[]> {
  const supabase = await createClient();
  const perSource = Math.ceil(limit / 2);

  const [contentRes, prayerRes] = await Promise.all([
    supabase
      .from("topic_content")
      .select("id, title, country_code, created_at, topics(slug)")
      .not("country_code", "is", null)
      .or("moderation_status.is.null,moderation_status.eq.approved")
      .order("created_at", { ascending: false })
      .limit(perSource),
    supabase
      .from("prayer_request")
      .select("id, title, country_code, created_at")
      .not("country_code", "is", null)
      .eq("is_anonymous", false)
      .or(approvedModerationOrFilter("moderation_status"))
      .in("status", ["active", "answered"])
      .order("created_at", { ascending: false })
      .limit(perSource),
  ]);

  const items: RecentGeoPost[] = [];

  for (const row of contentRes.data ?? []) {
    const code = String(row.country_code ?? "").toUpperCase();
    const topics = row.topics as { slug: string } | { slug: string }[] | null;
    const slug = Array.isArray(topics) ? topics[0]?.slug : topics?.slug;
    if (!code || !slug) continue;
    items.push({
      countryCode: code,
      countryName: countryName(code) ?? code,
      flag: countryFlagEmoji(code),
      title: String(row.title ?? "Post"),
      href: `/channel/${slug}/content/${row.id}`,
      createdAt: row.created_at as string,
      kind: "content",
    });
  }

  for (const row of prayerRes.data ?? []) {
    const code = String(row.country_code ?? "").toUpperCase();
    if (!code) continue;
    items.push({
      countryCode: code,
      countryName: countryName(code) ?? code,
      flag: countryFlagEmoji(code),
      title: String(row.title ?? "Prayer request"),
      href: `/prayer/${row.id}`,
      createdAt: row.created_at as string,
      kind: "prayer",
    });
  }

  return items
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
