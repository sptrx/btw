"use client";

import { useRouter } from "next/navigation";
import { shareContent } from "@/actions/channels";
import { PostReactions } from "@/components/post-reactions";
import { ShareButton } from "@/components/share-button";
import { KeepContentButton } from "@/components/keep-content-button";
import type { PostReactionType, ReactionCounts } from "@/lib/post-reactions";

type Props = {
  contentId: string;
  channelSlug: string;
  contentTitle?: string;
  shareCount: number;
  reactionCounts: ReactionCounts;
  userReaction: PostReactionType | null;
  hasKept?: boolean;
  isAuthenticated?: boolean;
};

export default function ContentActions({
  contentId,
  channelSlug,
  contentTitle,
  shareCount,
  reactionCounts,
  userReaction,
  hasKept = false,
  isAuthenticated = false,
}: Props) {
  const router = useRouter();
  const sharePath = `/channel/${channelSlug}/content/${contentId}`;

  const handleShareToFeed = async () => {
    const res = await shareContent(contentId);
    if (res?.success) router.refresh();
  };

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <PostReactions
        postId={contentId}
        postKind="topic_content"
        initialCounts={reactionCounts}
        initialUserReaction={userReaction}
        isAuthenticated={isAuthenticated}
        loginNext={sharePath}
      />

      <div className="flex flex-wrap items-center gap-3">
        <KeepContentButton
          contentId={contentId}
          channelSlug={channelSlug}
          initialKept={hasKept}
          isAuthenticated={isAuthenticated}
        />

        <ShareButton
          path={sharePath}
          title={contentTitle}
          text={contentTitle ? `Check out: ${contentTitle}` : undefined}
          isAuthenticated={isAuthenticated}
          countLabel={shareCount > 0 ? String(shareCount) : undefined}
          onShareToFeed={handleShareToFeed}
          onShareWithFollower={() => {
            router.push(`/channel/${channelSlug}/content/${contentId}/send`);
          }}
        />
      </div>
    </div>
  );
}
