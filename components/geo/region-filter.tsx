"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronDown, Globe } from "lucide-react";
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

  const detailsRef = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => detailsRef.current?.removeAttribute("open");

  const activeLabel = GEO_REGIONS.find((r) => r.id === active)?.label ?? null;

  const itemClass = (selected: boolean) =>
    cn(
      "block rounded-md px-3 py-2 text-sm transition-colors",
      selected
        ? "bg-primary/10 font-medium text-primary"
        : "text-foreground hover:bg-muted/60"
    );

  // Optional filter: one compact control instead of a row of tabs.
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <details ref={detailsRef} className="group relative">
        <summary
          className={cn(
            "flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors [&::-webkit-details-marker]:hidden",
            activeLabel
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/80 bg-muted/30 text-foreground hover:bg-muted/60"
          )}
        >
          <Globe className="h-4 w-4" aria-hidden />
          {activeLabel ? `Region: ${activeLabel}` : "Filter by region"}
          <ChevronDown
            className="h-4 w-4 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div
          role="menu"
          onClick={closeMenu}
          className="absolute left-0 z-20 mt-2 w-52 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          <Link href={buildHref(null)} role="menuitem" className={itemClass(!active)}>
            All regions
          </Link>
          {GEO_REGIONS.map((r) => (
            <Link key={r.id} href={buildHref(r.id)} role="menuitem" className={itemClass(active === r.id)}>
              {r.label}
            </Link>
          ))}
        </div>
      </details>
      {activeLabel && (
        <Link
          href={buildHref(null)}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear
        </Link>
      )}
    </div>
  );
}
