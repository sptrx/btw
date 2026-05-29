import { normalizeCountryCode } from "@/lib/geo";

/** Country is stored on anonymous requests but hidden from everyone except the author. */
export function visiblePrayerCountryCode(
  countryCode: string | null | undefined,
  isAnonymous: boolean,
  authorId: string,
  viewerId: string | null
): string | null {
  if (isAnonymous && viewerId !== authorId) return null;
  return normalizeCountryCode(countryCode);
}
