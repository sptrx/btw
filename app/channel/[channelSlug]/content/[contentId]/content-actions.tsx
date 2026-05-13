"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addFeedback,
  removeFeedback,
  shareContent,
} from "@/actions/channels";
import { ShareButton } from "@/components/share-button";

type Props = {
  contentId: string;
  channelSlug: string;
  contentTitle?: string;
  likes: number;
  helpful: number;
  shareCount: number;
  hasLiked?: boolean;
  hasHelpful?: boolean;
  /**
   * When false, like/helpful/"share to feed" become sign-in prompts but the
   * primary share button (copy link / native share) still works.
   */
  isAuthenticated?: boolean;
};

export default function ContentActions({
  contentId,
  channelSlug,
  contentTitle,
  likes,
  helpful,
  shareCount,
  hasLiked = false,
  hasHelpful = false,
  isAuthenticated = false,
}: Props) {
  const router = useRouter();
  const [l, setL] = useState(likes);
  const [h, setH] = useState(helpful);
  const [s, setS] = useState(shareCount);
  const [liked, setLiked] = useState(hasLiked);
  const [helpfulGiven, setHelpfulGiven] = useState(hasHelpful);
  const [loading, setLoading] = useState<string | null>(null);

  const sharePath = `/channel/${channelSlug}/content/${contentId}`;
  const loginHref = `/auth/login?next=${encodeURIComponent(sharePath)}`;

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }
    setLoading("like");
    const res = liked ? await removeFeedback(contentId, "like") : await addFeedback(contentId, "like");
    if (res?.success) {
      setLiked(!liked);
      setL((prev) => prev + (liked ? -1 : 1));
      router.refresh();
    }
    setLoading(null);
  };

  const handleHelpful = async () => {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }
    setLoading("helpful");
    const res = helpfulGiven ? await removeFeedback(contentId, "helpful") : await addFeedback(contentId, "helpful");
    if (res?.success) {
      setHelpfulGiven(!helpfulGiven);
      setH((prev) => prev + (helpfulGiven ? -1 : 1));
      router.refresh();
    }
    setLoading(null);
  };

  const handleShareToFeed = async () => {
    setLoading("share");
    const res = await shareContent(contentId);
    if (res?.success) {
      setS((prev) => prev + 1);
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t">
      <button
        type="button"
        onClick={handleLike}
        disabled={!!loading}
        className={`px-3 py-1 rounded text-sm ${liked ? "bg-indigo-100 dark:bg-indigo-900/50" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
      >
        👍 {l} Like
      </button>
      <button
        type="button"
        onClick={handleHelpful}
        disabled={!!loading}
        className={`px-3 py-1 rounded text-sm ${helpfulGiven ? "bg-indigo-100 dark:bg-indigo-900/50" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
      >
        ✓ {h} Helpful
      </button>

      <ShareButton
        path={sharePath}
        title={contentTitle}
        text={contentTitle ? `Check out: ${contentTitle}` : undefined}
        isAuthenticated={isAuthenticated}
        countLabel={s > 0 ? String(s) : undefined}
        onShareToFeed={handleShareToFeed}
        onShareWithFollower={() => {
          router.push(`/channel/${channelSlug}/content/${contentId}/send`);
        }}
      />
    </div>
  );
}
