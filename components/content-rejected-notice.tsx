import { ShieldAlert } from "lucide-react";
import { REJECTED_CONTENT_MESSAGE } from "@/lib/moderation-messages";
import { cn } from "@/lib/utils";

type Props = {
  note?: string | null;
  className?: string;
};

export function ContentRejectedNotice({ note, className }: Props) {
  const trimmedNote = note?.trim();

  return (
    <div
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm leading-relaxed text-foreground",
        className
      )}
      role="status"
    >
      <div className="flex gap-2.5">
        <ShieldAlert
          className="mt-0.5 size-4 shrink-0 text-destructive/80"
          aria-hidden
        />
        <div className="min-w-0 space-y-2">
          <p>{REJECTED_CONTENT_MESSAGE}</p>
          {trimmedNote ? (
            <p className="rounded-lg border border-destructive/15 bg-background/60 px-3 py-2 text-foreground/90">
              <span className="font-medium">Moderator note: </span>
              {trimmedNote}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
