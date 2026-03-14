type Comment = {
  id: string;
  body: string;
  created_at: string;
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
          <p className="mt-1">{c.body}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
