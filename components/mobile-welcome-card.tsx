"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { RotatingSlogan } from "@/components/rotating-slogan";

const STORAGE_KEY = "btw-welcome-dismissed";

/** Short, dismissible pitch above the feed for signed-out visitors. */
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
      className="relative mb-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss welcome message"
        className="absolute right-1.5 top-1.5 inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
      <RotatingSlogan
        className="pr-10 text-lg font-semibold leading-snug text-foreground"
        supportClassName="mt-1.5 text-sm leading-relaxed text-muted-foreground"
      />
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        A faith community for testimonies, prayer and encouragement. Everything is checked by AI
        moderation, so it is safe for every age.
      </p>
      <Link
        href="/post/new"
        className="mt-3 inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Post it
      </Link>
    </section>
  );
}
