import Link from "next/link";
import { Globe2 } from "lucide-react";
import type { MapSummary } from "@/actions/map";
import { cn } from "@/lib/utils";

type Props = {
  summary: MapSummary;
  className?: string;
};

/** Homepage thumbnail linking to the full world map. */
export function FaithMapWidget({ summary, className }: Props) {
  const n = summary.countryCount;
  if (n === 0) return null;

  return (
    <Link
      href="/map"
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-border/80 bg-gradient-to-br from-amber-500/10 via-background to-muted/30 p-5 transition-colors hover:border-primary/40 hover:bg-muted/20",
        className
      )}
    >
      <div className="flex items-center gap-2 text-primary">
        <Globe2 className="size-5" aria-hidden />
        <span className="text-sm font-medium">Faith around the world</span>
      </div>
      <div
        className="relative h-24 overflow-hidden rounded-lg border border-border/60 bg-muted/30"
        aria-hidden
      >
        <svg viewBox="0 0 360 120" className="h-full w-full opacity-80">
          <ellipse cx="180" cy="70" rx="160" ry="50" className="fill-muted/50" />
          {[40, 90, 140, 200, 260, 300].map((x, i) => (
            <circle
              key={x}
              cx={x}
              cy={55 + (i % 3) * 12}
              r={4 + (i % 4)}
              className="fill-amber-500/70 group-hover:fill-amber-400"
            />
          ))}
        </svg>
      </div>
      <p className="text-sm text-foreground">
        Faith from{" "}
        <span className="font-semibold tabular-nums">{n}</span>{" "}
        {n === 1 ? "country" : "countries"}
      </p>
      <p className="text-xs text-muted-foreground">Explore the interactive map →</p>
    </Link>
  );
}
