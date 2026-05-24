"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Footprints } from "lucide-react";
import { walkWithChannel, stopWalkingWithChannel } from "@/actions/library";
import { LIBRARY_LABELS } from "@/lib/library-vocabulary";
import { cn } from "@/lib/utils";

type Props = {
  topicId: string;
  channelSlug: string;
  initialWalkingWith: boolean;
  isAuthenticated: boolean;
  className?: string;
};

export function WalkWithChannelButton({
  topicId,
  channelSlug,
  initialWalkingWith,
  isAuthenticated,
  className,
}: Props) {
  const router = useRouter();
  const [walkingWith, setWalkingWith] = useState(initialWalkingWith);
  const [loading, setLoading] = useState(false);

  const loginHref = `/auth/login?next=${encodeURIComponent(`/channel/${channelSlug}`)}`;

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }
    setLoading(true);
    const prev = walkingWith;
    setWalkingWith(!prev);
    const res = prev
      ? await stopWalkingWithChannel(topicId, channelSlug)
      : await walkWithChannel(topicId, channelSlug);
    if (!res || "error" in res) {
      setWalkingWith(prev);
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={walkingWith}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
        walkingWith
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-foreground hover:bg-muted",
        className
      )}
    >
      <Footprints className="size-4 shrink-0" aria-hidden />
      {walkingWith ? LIBRARY_LABELS.walkWith.active : LIBRARY_LABELS.walkWith.action}
    </button>
  );
}
