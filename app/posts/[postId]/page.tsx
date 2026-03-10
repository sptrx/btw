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
    <div className="border rounded-lg p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        <Link href={`/profile/${user_id}`} className="hover:underline">
          {displayName}
        </Link>
      </div>
      <div className="text-lg">{text}</div>

      <div className="flex space-x-4 mt-2 text-sm text-gray-500">
        <span>Likes: {likes ?? 0}</span>
        <span>Reposts: {reposts ?? 0}</span>
      </div>

      {isOwner && (
        <div className="flex justify-end space-x-4 mt-4 pt-2 border-t">
          <Button btnText="Delete" postId={postId} handler={deletePost} />
          <Button btnText="Edit" postId={postId} handler={navigateToEditPage} />
        </div>
      )}
    </div>
  );
}
