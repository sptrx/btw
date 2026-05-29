import type { GeoRegionId } from "@/lib/geo/regions";

/** ISO 3166-1 alpha-2 codes grouped by broad region (country-level only). */
const CODES_BY_REGION: Record<GeoRegionId, readonly string[]> = {
  africa: [
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", "CD", "CI", "DJ",
    "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "LY", "MG",
    "MW", "ML", "MR", "MU", "YT", "MA", "MZ", "NA", "NE", "NG", "RE", "RW", "SH", "ST", "SN",
    "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "EH", "ZM", "ZW",
  ],
  middle_east: [
    "BH", "IR", "IQ", "IL", "JO", "KW", "LB", "OM", "PS", "QA", "SA", "SY", "TR", "AE", "YE",
    "CY", "AM", "AZ", "GE",
  ],
  asia: [
    "AF", "BD", "BT", "BN", "KH", "CN", "HK", "MO", "IN", "ID", "JP", "KZ", "KG", "LA", "MY",
    "MV", "MN", "MM", "NP", "KP", "PK", "PH", "SG", "KR", "LK", "TW", "TJ", "TH", "TL", "TM",
    "UZ", "VN", "BN",
  ],
  europe: [
    "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CZ", "DK", "EE", "FO", "FI", "FR", "DE",
    "GI", "GR", "GG", "HU", "IS", "IE", "IM", "IT", "JE", "XK", "LV", "LI", "LT", "LU", "MT",
    "MD", "MC", "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES",
    "SE", "CH", "UA", "GB", "VA",
  ],
  americas: [
    "AI", "AG", "AR", "AW", "BS", "BB", "BZ", "BM", "BO", "BR", "VG", "CA", "KY", "CL", "CO",
    "CR", "CU", "CW", "DM", "DO", "EC", "SV", "FK", "GF", "GL", "GD", "GP", "GT", "GY", "HT",
    "HN", "JM", "MQ", "MX", "MS", "NI", "PA", "PY", "PE", "PR", "BL", "KN", "LC", "MF", "PM",
    "VC", "SX", "SR", "TT", "TC", "US", "UY", "VE", "VI",
  ],
  oceania: [
    "AS", "AU", "CK", "FJ", "PF", "GU", "KI", "MH", "FM", "NR", "NC", "NZ", "NU", "NF", "MP",
    "PW", "PG", "PN", "WS", "SB", "TK", "TO", "TV", "VU", "WF",
  ],
};

const regionByCode = new Map<string, GeoRegionId>();
for (const [region, codes] of Object.entries(CODES_BY_REGION) as [GeoRegionId, readonly string[]][]) {
  for (const code of codes) {
    regionByCode.set(code, region);
  }
}

const displayNames =
  typeof Intl !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export function countryFlagEmoji(countryCode: string | null | undefined): string {
  const code = normalizeCountryCode(countryCode);
  if (!code) return "";
  const base = 0x1f1e6;
  return [...code].map((c) => String.fromCodePoint(base + c.charCodeAt(0) - 65)).join("");
}

export function normalizeCountryCode(code: string | null | undefined): string | null {
  if (!code || typeof code !== "string") return null;
  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return upper;
}

export function isValidCountryCode(code: string | null | undefined): boolean {
  const normalized = normalizeCountryCode(code);
  if (!normalized) return false;
  if (!displayNames) return regionByCode.has(normalized);
  try {
    const name = displayNames.of(normalized);
    return Boolean(name && name !== normalized);
  } catch {
    return regionByCode.has(normalized);
  }
}

export function countryName(countryCode: string | null | undefined): string | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;
  try {
    return displayNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

export function regionFromCountryCode(countryCode: string | null | undefined): GeoRegionId | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;
  return regionByCode.get(code) ?? null;
}

export type CountryOption = {
  code: string;
  name: string;
  region: GeoRegionId;
  flag: string;
};

/** All countries we support for pickers and filters, sorted by name. */
export function listCountryOptions(): CountryOption[] {
  const codes = new Set<string>();
  for (const list of Object.values(CODES_BY_REGION)) {
    for (const c of list) codes.add(c);
  }
  const options: CountryOption[] = [];
  for (const code of codes) {
    const region = regionByCode.get(code);
    const name = countryName(code);
    if (!region || !name) continue;
    options.push({
      code,
      name,
      region,
      flag: countryFlagEmoji(code),
    });
  }
  return options.sort((a, b) => a.name.localeCompare(b.name));
}

/** ISO codes in a region (for feed/channel filters). */
export function countryCodesInRegion(regionId: GeoRegionId): string[] {
  return [...(CODES_BY_REGION[regionId] ?? [])];
}

export function parseCountryFromForm(value: FormDataEntryValue | null): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const code = normalizeCountryCode(raw);
  if (!code || !isValidCountryCode(code)) return null;
  return code;
}
