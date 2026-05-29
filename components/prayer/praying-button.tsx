"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { togglePrayer } from "@/actions/prayer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  prayerRequestId: string;
  initialCount: number;
  initialPraying: boolean;
  isAuthenticated: boolean;
  size?: "sm" | "default";
  className?: string;
};

export function PrayingButton({
  prayerRequestId,
  initialCount,
  initialPraying,
  isAuthenticated,
  size = "sm",
  className,
}: Props) {
  const router = useRouter();
  const [praying, setPraying] = useState(initialPraying);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size={size}
        asChild
        className={cn("rounded-full gap-1.5", className)}
      >
        <Link href={`/auth/login?next=/prayer/${prayerRequestId}`}>
          <span aria-hidden>🙏</span>
          Praying
          {count > 0 ? (
            <span className="tabular-nums text-muted-foreground">({count})</span>
          ) : null}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={praying ? "default" : "outline"}
      size={size}
      disabled={loading}
      className={cn("rounded-full gap-1.5", praying && "bg-primary/90", className)}
      onClick={async () => {
        setLoading(true);
        const prevPraying = praying;
        const prevCount = count;
        setPraying(!prevPraying);
        setCount(prevCount + (prevPraying ? -1 : 1));
        const res = await togglePrayer(prayerRequestId);
        setLoading(false);
        if (res?.error) {
          setPraying(prevPraying);
          setCount(prevCount);
        } else {
          router.refresh();
        }
      }}
    >
      <span aria-hidden>🙏</span>
      {praying ? "Praying" : "Pray"}
      <span className="tabular-nums">{count > 0 ? count : null}</span>
    </Button>
  );
}
