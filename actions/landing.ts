"use server";

import { createClient } from "@/utils/supabase/server";

/** Card shape consumed by `LandingHome` featured grid */
export type LandingFeaturedCard = {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  accent: string;
};

export type LandingIntroCopy = {
  headline: string;
  body: string;
};

const ACCENT_ROTATION = [
  "from-amber-900/80 to-stone-900/90",
  "from-indigo-950/85 to-slate-950/90",
  "from-rose-950/80 to-neutral-950/90",
  "from-emerald-950/80 to-stone-950/90",
  "from-violet-950/80 to-neutral-950/90",
  "from-sky-950/80 to-slate-950/90",
] as const;

const FALLBACK_CARD_IMAGE =
  "https://images.unsplash.com/photo-1507692043040-9e896755c0ff?auto=format&fit=crop&w=900&q=80";

/**
 * Curated home content from Supabase (`site_home_featured`, `site_home_copy`).
 * Manage rows in the Dashboard (SQL editor / Table editor) or sync from a headless CMS into these tables.
 */
export async function getLandingHomeData(): Promise<{
  featured: LandingFeaturedCard[];
  intro: LandingIntroCopy | null;
}> {
  const supabase = await createClient();

  let intro: LandingIntroCopy | null = null;
  const { data: copyRow, error: copyErr } = await supabase
    .from("site_home_copy")
    .select("intro_headline, intro_body")
    .eq("id", 1)
    .maybeSingle();

  if (copyErr) {
    console.warn("[landing] site_home_copy:", copyErr.message);
  } else if (copyRow?.intro_headline || copyRow?.intro_body) {
    intro = {
      headline: copyRow.intro_headline?.trim() || "",
      body: copyRow.intro_body?.trim() || "",
    };
  }

  const { data: featuredRows, error: feErr } = await supabase
    .from("site_home_featured")
    .select("channel_id, sort_order, card_subtitle")
    .order("sort_order", { ascending: true });

  if (feErr) {
    console.warn("[landing] site_home_featured:", feErr.message);
    return { featured: [], intro };
  }

  if (!featuredRows?.length) {
    return { featured: [], intro };
  }

  const ids = featuredRows.map((r) => r.channel_id);
  const { data: topics, error: topicsErr } = await supabase
    .from("topics")
    .select("id, title, slug, description, cover_image_url")
    .in("id", ids);

  if (topicsErr || !topics?.length) {
    console.warn("[landing] topics for featured:", topicsErr?.message);
    return { featured: [], intro };
  }

  const topicById = new Map(topics.map((t) => [t.id, t]));
  const featured: LandingFeaturedCard[] = [];

  for (let i = 0; i < featuredRows.length; i++) {
    const row = featuredRows[i];
    const t = topicById.get(row.channel_id);
    if (!t) continue;
    const image =
      (t.cover_image_url && t.cover_image_url.trim()) ? t.cover_image_url.trim() : FALLBACK_CARD_IMAGE;
    const subtitle =
      (row.card_subtitle && row.card_subtitle.trim()) ||
      (t.description && t.description.trim().slice(0, 80)) ||
      "Channel";
    featured.push({
      title: t.title,
      subtitle,
      href: `/channel/${t.slug}`,
      image,
      accent: ACCENT_ROTATION[i % ACCENT_ROTATION.length],
    });
  }

  return { featured, intro };
}
