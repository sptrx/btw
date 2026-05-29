/** Broad faith-community regions — country level only, never city. */

export const GEO_REGIONS = [
  { id: "africa", label: "Africa" },
  { id: "asia", label: "Asia" },
  { id: "americas", label: "Americas" },
  { id: "europe", label: "Europe" },
  { id: "oceania", label: "Oceania" },
  { id: "middle_east", label: "Middle East" },
] as const;

export type GeoRegionId = (typeof GEO_REGIONS)[number]["id"];

export function isGeoRegionId(value: string): value is GeoRegionId {
  return GEO_REGIONS.some((r) => r.id === value);
}

export function geoRegionLabel(id: GeoRegionId): string {
  return GEO_REGIONS.find((r) => r.id === id)?.label ?? id;
}
