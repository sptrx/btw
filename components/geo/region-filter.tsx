"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GEO_REGIONS } from "@/lib/geo";
import { cn } from "@/lib/utils";

type Props = {
  /** Base path, e.g. /feed or /channel/browse */
  basePath: string;
  /** Query param key — default `region` */
  paramKey?: string;
  /** Preserve these search params when switching region */
  preserveParams?: string[];
  className?: string;
};

export function RegionFilter({
  basePath,
  paramKey = "region",
  preserveParams = ["filter", "q", "topic"],
  className,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(paramKey);

  const buildHref = (regionId: string | null) => {
    const params = new URLSearchParams();
    for (const key of preserveParams) {
      const v = searchParams.get(key);
      if (v) params.set(key, v);
    }
    if (regionId) params.set(paramKey, regionId);
    const qs = params.toString();
    const path = pathname.startsWith(basePath) ? pathname : basePath;
    return qs ? `${path}?${qs}` : path;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        By region
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref(null)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            !active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/80 bg-muted/30 text-foreground hover:bg-muted/60"
          )}
        >
          All regions
        </Link>
        {GEO_REGIONS.map((r) => (
          <Link
            key={r.id}
            href={buildHref(r.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active === r.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/80 bg-muted/30 text-foreground hover:bg-muted/60"
            )}
          >
            {r.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
