import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { isValidCountryCode, normalizeCountryCode } from "@/lib/geo";

export const runtime = "nodejs";

/** Cloudflare / edge country header (ISO 3166-1 alpha-2). */
function countryFromRequest(req: NextRequest): string | null {
  const cf = req.headers.get("cf-ipcountry")?.trim().toUpperCase();
  if (cf && cf !== "XX" && cf !== "T1" && isValidCountryCode(cf)) {
    return cf;
  }
  return null;
}

/**
 * Set home country from IP once per profile (sign-up / OAuth callback).
 * Only fills when `profiles.country_code` is still null.
 */
export async function POST(req: NextRequest) {
  const detected = countryFromRequest(req);
  if (!detected) {
    return NextResponse.json({ skipped: true, reason: "no_country_header" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: readErr } = await supabase
    .from("profiles")
    .select("country_code")
    .eq("id", user.id)
    .maybeSingle();

  if (readErr) {
    if (readErr.message?.toLowerCase().includes("country_code")) {
      return NextResponse.json({ skipped: true, reason: "migration_pending" });
    }
    return NextResponse.json({ error: "Could not read profile" }, { status: 500 });
  }

  const existing = normalizeCountryCode(profile?.country_code);
  if (existing) {
    return NextResponse.json({ country_code: existing, alreadySet: true });
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ country_code: detected, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateErr) {
    console.warn("[home-country]", updateErr.message);
    return NextResponse.json({ skipped: true, reason: "update_failed" });
  }

  revalidatePath("/dashboard/settings");
  return NextResponse.json({ country_code: detected, set: true });
}
