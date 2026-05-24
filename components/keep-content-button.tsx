"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { keepContent, unkeepContent } from "@/actions/library";
import { LIBRARY_LABELS } from "@/lib/library-vocabulary";

type Props = {
  contentId: string;
  channelSlug: string;
  initialKept: boolean;
  isAuthenticated: boolean;
};

export function KeepContentButton({
  contentId,
  channelSlug,
  initialKept,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const [kept, setKept] = useState(initialKept);
  const [loading, setLoading] = useState(false);

  const loginHref = `/auth/login?next=${encodeURIComponent(
    `/channel/${channelSlug}/content/${contentId}`
  )}`;

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }
    setLoading(true);
    const prev = kept;
    setKept(!prev);
    const res = prev
      ? await unkeepContent(contentId, channelSlug)
      : await keepContent(contentId, channelSlug);
    if (!res || "error" in res) {
      setKept(prev);
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
      aria-pressed={kept}
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-out active:scale-95 disabled:opacity-60 ${
        kept
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border text-foreground hover:bg-muted"
      }`}
    >
      <Bookmark className="mr-1 inline-block size-3.5" aria-hidden />
      {kept ? LIBRARY_LABELS.keep.active : LIBRARY_LABELS.keep.action}
    </button>
  );
}
