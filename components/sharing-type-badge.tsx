import type { SharingType } from "@/lib/sharing-types";
import {
  SHARING_TYPE_CONFIG,
  isSharingType,
  sharingTypeBadgeClass,
  sharingTypeLabel,
} from "@/lib/sharing-types";
import { cn } from "@/lib/utils";

type Props = {
  sharingType: string;
  className?: string;
  /** Compact pill for card corner */
  size?: "sm" | "md";
};

export function SharingTypeBadge({ sharingType, className, size = "sm" }: Props) {
  const config = isSharingType(sharingType) ? SHARING_TYPE_CONFIG[sharingType] : null;
  const Icon = config?.icon;

  return (
    <span
      className={cn(
        "btw-overline inline-flex items-center gap-1 rounded-full border font-medium",
        sharingTypeBadgeClass(sharingType),
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {Icon ? <Icon className="size-3 shrink-0 opacity-80" aria-hidden /> : null}
      {config?.shortLabel ?? sharingTypeLabel(sharingType)}
    </span>
  );
}

export function sharingTypeFromLegacy(
  type: string,
  tagSlugs: string[] = []
): SharingType {
  if (tagSlugs.includes("revelation")) return "revelation";
  if (tagSlugs.includes("testimonies")) return "testimony";
  if (type === "discussion") return "discussion";
  return "testimony";
}
