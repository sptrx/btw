"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection } from "geojson";
import type { MapCountryDatum } from "@/app/api/map-data/route";
import { countryName } from "@/lib/geo";
import { cn } from "@/lib/utils";

const WORLD_GEO_URL =
  "https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json";

type Props = {
  className?: string;
  /** Poll map-data every N ms (default 5 min). Set 0 to disable. */
  pollMs?: number;
};

export function FaithWorldMap({ className, pollMs = 5 * 60 * 1000 }: Props) {
  const router = useRouter();
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [data, setData] = useState<MapCountryDatum[]>([]);
  const [hover, setHover] = useState<{
    code: string;
    x: number;
    y: number;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMapData = useCallback(async () => {
    try {
      const res = await fetch("/api/map-data");
      if (!res.ok) return;
      const json = (await res.json()) as { countries: MapCountryDatum[] };
      setData(json.countries ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch(WORLD_GEO_URL)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setGeo(json as FeatureCollection);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load world map.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadMapData();
    if (!pollMs) return;
    const id = setInterval(() => void loadMapData(), pollMs);
    return () => clearInterval(id);
  }, [loadMapData, pollMs]);

  const byCode = useMemo(() => {
    const m = new Map<string, MapCountryDatum>();
    for (const row of data) m.set(row.country_code, row);
    return m;
  }, [data]);

  const maxCount = useMemo(
    () => Math.max(1, ...data.map((d) => d.post_count)),
    [data]
  );

  const width = 960;
  const height = 500;

  const projection = useMemo(
    () =>
      geoMercator()
        .scale(145)
        .translate([width / 2, height / 1.45]),
    []
  );

  const pathGen = useMemo(() => geoPath(projection), [projection]);

  const fillForCode = (code: string | undefined) => {
    if (!code) return "hsl(var(--muted))";
    const row = byCode.get(code.toUpperCase());
    if (!row?.post_count) return "hsl(var(--muted) / 0.35)";
    const t = Math.min(1, row.post_count / maxCount);
    const lightness = 72 - t * 38;
    return `hsl(38 55% ${lightness}%)`;
  };

  const hoverRow = hover ? byCode.get(hover.code) : null;

  if (loadError) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">{loadError}</p>
    );
  }

  if (!geo) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-border bg-muted/20",
          className
        )}
        style={{ minHeight: 320 }}
        aria-busy
      >
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    );
  }

  const features = (geo.features ?? []) as Feature[];

  /** johan/world.geo.json uses `-99` for several non-country polygons — not unique as React keys. */
  function featureKey(feature: Feature, index: number): string {
    const code = String(feature.id ?? "").toUpperCase();
    const name = String(
      (feature.properties as { name?: string } | null)?.name ?? ""
    ).trim();
    if (code && code !== "-99") return `country-${code}`;
    if (name) return `region-${name.replace(/\s+/g, "-").toLowerCase()}`;
    return `feature-${index}`;
  }

  function isValidMapCountryCode(code: string): boolean {
    return /^[A-Z]{2}$/.test(code) && code !== "-99";
  }

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto rounded-xl border border-border/80 bg-muted/15 dark:bg-muted/10"
        role="img"
        aria-label="World map of community posts by country"
      >
        <g>
          {features.map((feature, i) => {
            const code = String(feature.id ?? "").toUpperCase();
            const validCode = isValidMapCountryCode(code) ? code : "";
            const d = pathGen(feature);
            if (!d) return null;
            const hasPosts = validCode ? byCode.has(validCode) : false;
            return (
              <path
                key={featureKey(feature, i)}
                d={d}
                fill={fillForCode(validCode || undefined)}
                stroke="hsl(var(--border))"
                strokeWidth={0.4}
                className={cn(
                  "transition-[fill,filter] duration-200",
                  hasPosts && "cursor-pointer hover:brightness-110"
                )}
                onMouseEnter={(e) => {
                  if (!validCode) return;
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    code: validCode,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => {
                  if (!hasPosts || !validCode) return;
                  router.push(`/feed?country=${encodeURIComponent(validCode)}`);
                }}
              />
            );
          })}
        </g>
      </svg>

      {hover && hoverRow ? (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-lg"
          style={{
            left: Math.min(hover.x + 12, width - 200),
            top: hover.y + 12,
          }}
          role="tooltip"
        >
          <p className="font-medium text-foreground">
            <span aria-hidden>{hoverRow.flag} </span>
            {hoverRow.country_name}
          </p>
          <p className="text-muted-foreground tabular-nums">
            {hoverRow.post_count} post{hoverRow.post_count === 1 ? "" : "s"}
          </p>
          {hoverRow.latest_post_title ? (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              Latest: {hoverRow.latest_post_title}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-primary">Click to view posts</p>
        </div>
      ) : hover ? (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-lg"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <p className="text-muted-foreground">
            {countryName(hover.code) ?? hover.code} — no posts yet
          </p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Darker gold = more posts · Click a highlighted country to filter the feed</span>
        <span className="tabular-nums">{data.length} countries represented</span>
      </div>
    </div>
  );
}
