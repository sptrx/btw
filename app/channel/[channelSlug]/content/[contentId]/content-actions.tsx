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
  const [pulse, setPulse] = useState<"like" | "helpful" | null>(null);

  const sharePath = `/channel/${channelSlug}/content/${contentId}`;
  const loginHref = `/auth/login?next=${encodeURIComponent(sharePath)}`;

  // Triggers a one-shot scale "pop" on the button. Auto-clears so a quick
  // second click re-fires the animation.
  const triggerPulse = (kind: "like" | "helpful") => {
    setPulse(null);
    requestAnimationFrame(() => {
      setPulse(kind);
      window.setTimeout(
        () => setPulse((cur) => (cur === kind ? null : cur)),
        220,
      );
    });
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }
    const prevLiked = liked;
    const prevL = l;
    setLiked(!prevLiked);
    setL(prevL + (prevLiked ? -1 : 1));
    triggerPulse("like");
    setLoading("like");
    const res = prevLiked
      ? await removeFeedback(contentId, "like")
      : await addFeedback(contentId, "like");
    if (res?.success) {
      router.refresh();
    } else {
      setLiked(prevLiked);
      setL(prevL);
    }
    setLoading(null);
  };

  const handleHelpful = async () => {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }
    const prevHelpful = helpfulGiven;
    const prevH = h;
    setHelpfulGiven(!prevHelpful);
    setH(prevH + (prevHelpful ? -1 : 1));
    triggerPulse("helpful");
    setLoading("helpful");
    const res = prevHelpful
      ? await removeFeedback(contentId, "helpful")
      : await addFeedback(contentId, "helpful");
    if (res?.success) {
      router.refresh();
    } else {
      setHelpfulGiven(prevHelpful);
      setH(prevH);
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
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
      <button
        type="button"
        onClick={handleLike}
        aria-pressed={liked}
        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-out active:scale-95 ${
          liked
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border text-foreground hover:bg-muted"
        } ${pulse === "like" ? "scale-110" : "scale-100"}`}
      >
        <span aria-hidden className="inline-block mr-1">
          {liked ? "❤️" : "👍"}
        </span>
        {l} Like
      </button>
      <button
        type="button"
        onClick={handleHelpful}
        aria-pressed={helpfulGiven}
        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-out active:scale-95 ${
          helpfulGiven
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border text-foreground hover:bg-muted"
        } ${pulse === "helpful" ? "scale-110" : "scale-100"}`}
      >
        <span aria-hidden className="inline-block mr-1">✓</span>
        {h} Helpful
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
