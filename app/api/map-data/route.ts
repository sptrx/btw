import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { countryName, countryFlagEmoji } from "@/lib/geo";

export const runtime = "nodejs";

const CACHE_SECONDS = 15 * 60;

export type MapCountryDatum = {
  country_code: string;
  country_name: string;
  post_count: number;
  latest_post_title: string | null;
  latest_post_date: string | null;
  flag: string;
};

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("map_country_aggregates");

  if (error) {
    console.warn("[map-data]", error.message);
    return NextResponse.json(
      { countries: [] as MapCountryDatum[], countryCount: 0 },
      {
        status: 200,
        headers: cacheHeaders(),
      }
    );
  }

  const countries: MapCountryDatum[] = (data ?? []).map(
    (row: {
      country_code: string;
      post_count: number;
      latest_post_title: string | null;
      latest_post_date: string | null;
    }) => {
      const code = String(row.country_code).toUpperCase();
      return {
        country_code: code,
        country_name: countryName(code) ?? code,
        post_count: Number(row.post_count) || 0,
        latest_post_title: row.latest_post_title,
        latest_post_date: row.latest_post_date,
        flag: countryFlagEmoji(code),
      };
    }
  );

  countries.sort((a, b) => b.post_count - a.post_count);

  return NextResponse.json(
    {
      countries,
      countryCount: countries.length,
      updatedAt: new Date().toISOString(),
    },
    { headers: cacheHeaders() }
  );
}

function cacheHeaders(): HeadersInit {
  return {
    "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=3600`,
  };
}
