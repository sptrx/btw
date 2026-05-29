import "server-only";

import {
  normalizeCountryCode,
  parseCountryFromForm,
  regionFromCountryCode,
} from "@/lib/geo/countries";

export type ResolvedContentGeo = {
  country_code: string | null;
  region: string | null;
};

/**
 * Resolve country + region for new content: explicit form value, else profile home country.
 */
export function resolveContentGeo(
  formData: FormData,
  profileCountryCode: string | null | undefined
): ResolvedContentGeo {
  const explicit = parseCountryFromForm(formData.get("country_code"));
  const code =
    explicit ?? normalizeCountryCode(profileCountryCode) ?? null;
  if (!code) return { country_code: null, region: null };
  return {
    country_code: code,
    region: regionFromCountryCode(code),
  };
}

export function isMissingGeoColumn(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  return (
    msg.includes("country_code") ||
    msg.includes("region") ||
    err.code === "42703"
  );
}
