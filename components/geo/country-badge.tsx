import { countryFlagEmoji, countryName } from "@/lib/geo";
import { cn } from "@/lib/utils";

type Props = {
  countryCode: string | null | undefined;
  className?: string;
};

/** Small flag + country name for post cards and headers. */
export function CountryBadge({ countryCode, className }: Props) {
  const name = countryName(countryCode);
  if (!name || !countryCode) return null;
  const flag = countryFlagEmoji(countryCode);
  return (
    <p className={cn("text-xs text-muted-foreground flex items-center gap-1", className)}>
      <span aria-hidden>{flag}</span>
      <span>{name}</span>
    </p>
  );
}
