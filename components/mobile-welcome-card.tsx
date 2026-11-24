"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "btw-welcome-dismissed";

/**
 * Short pitch for signed-out visitors on phones and tablets, where the left
 * column (which carries the same message on desktop) is hidden.
 */
export function MobileWelcomeCard() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setHidden(true);
    } catch {
      /* storage unavailable: just show the card */
    }
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      aria-label="Welcome"
      className="relative mb-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm lg:hidden"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss welcome message"
        className="absolute right-1.5 top-1.5 inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
      <h2 className="pr-10 text-lg font-semibold leading-snug text-foreground">
        Share your witness. Strengthen another.
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        A faith community for testimonies, prayer and encouragement. Everything is checked by AI
        moderation, so it is safe for every age.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" className="min-h-10 rounded-full">
          <Link href="/auth/signup">
            Get started
            <ArrowRight className="ml-1.5 size-3.5" aria-hidden />
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="min-h-10 rounded-full">
          <Link href="/channel/browse">Browse channels</Link>
        </Button>
      </div>
    </section>
  );
}
