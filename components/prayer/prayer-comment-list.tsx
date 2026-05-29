import type { PrayerCommentItem } from "@/actions/prayer";
import { RelativeDate } from "@/components/relative-date";

type Props = {
  comments: PrayerCommentItem[];
};

export function PrayerCommentList({ comments }: Props) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No encouragement yet. Be the first to lift this person up.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {comments.map((c) => (
        <li key={c.id} className="py-4 first:pt-0">
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{c.body}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {c.authorDisplayName?.trim() || "Community member"}
            </span>
            <span aria-hidden> · </span>
            <RelativeDate date={c.createdAt} className="tabular-nums" />
          </p>
        </li>
      ))}
    </ul>
  );
}
