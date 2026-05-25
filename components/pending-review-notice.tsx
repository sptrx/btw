import { Clock } from "lucide-react";
import { PENDING_REVIEW_MESSAGE } from "@/lib/moderation-messages";
import { cn } from "@/lib/utils";

type Props = {
  message?: string;
  className?: string;
};

export function PendingReviewNotice({ message = PENDING_REVIEW_MESSAGE, className }: Props) {
  return (
    <p
      className={cn(
        "flex gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/12 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:text-amber-50",
        className
      )}
      role="status"
    >
      <Clock className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
