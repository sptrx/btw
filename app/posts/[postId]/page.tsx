import { notFound } from "next/navigation";
import { getPost, deletePost, navigateToEditPage, getCurrentUser } from "@/actions";
import Button from "@/components/button";
import Link from "next/link";

type Props = {
  params: Promise<{ postId: string }>;
  searchParams: Promise<Record<string, string>>;
};

export default async function Post({ params }: Props) {
  const { postId } = await params;
  const [post, user] = await Promise.all([getPost(postId), getCurrentUser()]);

  if (!post) notFound();

  const { text, likes, reposts, user_id, profiles } = post;
  const displayName =
    (profiles as { display_name?: string } | null)?.display_name ?? "Anonymous";

  const isOwner = user?.id === user_id;

  return (
    <div className="btw-content-panel">
      <div className="mb-2 text-sm text-muted-foreground">
        <Link
          href={`/profile/${user_id}`}
          className="font-medium text-foreground transition-colors hover:text-primary hover:underline"
        >
          {displayName}
        </Link>
      </div>
      <div className="whitespace-pre-wrap text-lg leading-relaxed text-foreground">{text}</div>

      <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
        <span>Likes: {likes ?? 0}</span>
        <span>Reposts: {reposts ?? 0}</span>
      </div>

      {isOwner && (
        <div className="mt-4 flex justify-end gap-3 border-t border-border pt-3">
          <Button btnText="Delete" postId={postId} handler={deletePost} />
          <Button btnText="Edit" postId={postId} handler={navigateToEditPage} />
        </div>
      )}
    </div>
  );
}
