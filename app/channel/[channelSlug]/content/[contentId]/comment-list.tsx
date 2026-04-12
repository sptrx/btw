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
    return <p className="text-gray-500 text-sm">No comments yet.</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="border rounded p-3">
          <p className="text-sm text-gray-500">{c.profiles?.display_name ?? "Anonymous"}</p>
          <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
          {c.scripture_guide_reply ? (
            <div className="mt-3 rounded-md border border-indigo-200 bg-indigo-50/80 px-3 py-2 dark:border-indigo-800 dark:bg-indigo-950/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-200">
                Scripture guide
              </p>
              <p className="mt-1 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {c.scripture_guide_reply}
              </p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
