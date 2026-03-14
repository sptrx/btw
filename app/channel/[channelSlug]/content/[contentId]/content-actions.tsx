"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addFeedback,
  removeFeedback,
  shareContent,
} from "@/actions/channels";

type Props = {
  contentId: string;
  channelSlug: string;
  likes: number;
  helpful: number;
  shareCount: number;
  hasLiked?: boolean;
  hasHelpful?: boolean;
};

export default function ContentActions({
  contentId,
  channelSlug,
  likes,
  helpful,
  shareCount,
  hasLiked = false,
  hasHelpful = false,
}: Props) {
  const router = useRouter();
  const [l, setL] = useState(likes);
  const [h, setH] = useState(helpful);
  const [s, setS] = useState(shareCount);
  const [liked, setLiked] = useState(hasLiked);
  const [helpfulGiven, setHelpfulGiven] = useState(hasHelpful);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const shareUrl = `/channel/${channelSlug}/content/${contentId}`;

  const copyLink = () => {
    const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${shareUrl}` : shareUrl;
    navigator.clipboard.writeText(fullUrl);
    setShared(true);
    setS((prev) => prev + 1);
  };

  const handleLike = async () => {
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
    setLoading("helpful");
    const res = helpfulGiven ? await removeFeedback(contentId, "helpful") : await addFeedback(contentId, "helpful");
    if (res?.success) {
      setHelpfulGiven(!helpfulGiven);
      setH((prev) => prev + (helpfulGiven ? -1 : 1));
      router.refresh();
    }
    setLoading(null);
  };

  const handleShare = async () => {
    setLoading("share");
    const res = await shareContent(contentId);
    if (res?.success) {
      setShared(true);
      setS((prev) => prev + 1);
      copyLink();
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
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
      <button
        type="button"
        onClick={handleShare}
        disabled={!!loading}
        className="px-3 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        ↗ Share ({s})
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="px-3 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800 border"
      >
        📋 Copy link
      </button>
    </div>
  );
}
