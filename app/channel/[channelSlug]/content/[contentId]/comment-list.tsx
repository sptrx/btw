import { RelativeDate } from "@/components/relative-date";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  scripture_guide_reply?: string | null;
  profiles: { display_name?: string } | null;
};

type Props = { comments: Comment[] };

export default function CommentList({ comments }: Props) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet.</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border border-border bg-card p-3 text-card-foreground sm:p-4"
        >
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {c.profiles?.display_name ?? "Anonymous"}
            </p>
            <RelativeDate date={c.created_at} className="text-xs text-muted-foreground" />
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {c.body}
          </p>
          {c.scripture_guide_reply ? (
            <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Scripture guide
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {c.scripture_guide_reply}
              </p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
