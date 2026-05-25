import Link from "next/link";
import { MISSION_TAGLINE } from "@/lib/moderation-messages";

type Props = {
  variant?: "default" | "compact";
};

export function ContentMissionHint({ variant = "default" }: Props) {
  const isCompact = variant === "compact";
  return (
    <div
      className={
        isCompact
          ? "rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground"
          : "rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"
      }
    >
      <p className={isCompact ? "font-medium text-foreground mb-1" : "font-medium text-foreground mb-1.5"}>
        {MISSION_TAGLINE}
      </p>
      <p>
        Share testimony, scripture reflection, prayer, or encouragement—not political campaigns or general
        opinion posts.{" "}
        <Link href="/legal/community-guidelines" className="text-primary font-medium hover:underline">
          Read community guidelines
        </Link>
      </p>
    </div>
  );
}
