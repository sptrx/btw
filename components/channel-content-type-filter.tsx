"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SHARING_TYPES, SHARING_TYPE_CONFIG } from "@/lib/sharing-types";
import { cn } from "@/lib/utils";

type Props = {
  channelSlug: string;
  pageSlug?: string;
};

export function ChannelContentTypeFilter({ channelSlug, pageSlug }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("type") ?? "";

  const basePath = pageSlug
    ? `/channel/${channelSlug}/${pageSlug}`
    : `/channel/${channelSlug}`;

  const makeHref = (type: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type) params.set("type", type);
    else params.delete("type");
    const q = params.toString();
    return q ? `${basePath}?${q}` : basePath;
  };

  return (
    <div className="mb-4 flex flex-wrap gap-2" role="toolbar" aria-label="Filter by post type">
      <FilterPill href={makeHref(null)} active={!active} label="All" />
      {SHARING_TYPES.map((type) => (
        <FilterPill
          key={type}
          href={makeHref(type)}
          active={active === type}
          label={SHARING_TYPE_CONFIG[type].shortLabel}
        />
      ))}
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/80 bg-muted/30 text-foreground hover:bg-muted/60"
      )}
    >
      {label}
    </Link>
  );
}

export function filterItemsBySharingType<T extends { sharing_type?: string | null }>(
  items: T[],
  typeParam: string | null
): T[] {
  if (!typeParam) return items;
  return items.filter((i) => i.sharing_type === typeParam);
}
