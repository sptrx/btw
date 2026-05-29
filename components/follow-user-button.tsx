"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus } from "lucide-react";
import { followUser, unfollowUser } from "@/actions/follows";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  displayName: string;
  initialFollowing: boolean;
  isAuthenticated: boolean;
  loginNext?: string;
  /** Compact text link for inline use next to author names */
  variant?: "button" | "link";
  className?: string;
};

export function FollowUserButton({
  userId,
  displayName,
  initialFollowing,
  isAuthenticated,
  loginNext = "/feed",
  variant = "button",
  className,
}: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const firstName = displayName.trim().split(/\s+/)[0] || "them";

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(loginNext)}`);
      return;
    }
    setLoading(true);
    const prev = following;
    setFollowing(!prev);
    const res = prev ? await unfollowUser(userId) : await followUser(userId);
    if (!res || "error" in res) {
      setFollowing(prev);
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={cn(
          "text-xs font-medium text-primary hover:underline disabled:opacity-60",
          className
        )}
      >
        {following ? "Following" : `Follow ${firstName}`}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={following}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
        following
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-foreground hover:bg-muted",
        className
      )}
    >
      {following ? (
        <UserMinus className="size-4 shrink-0" aria-hidden />
      ) : (
        <UserPlus className="size-4 shrink-0" aria-hidden />
      )}
      {following ? "Following" : "Follow"}
    </button>
  );
}
